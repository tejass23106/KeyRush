import Phaser from "phaser";
import { Player, CAR_COLORS } from "../types/game";

type Pt = {
  x: number;
  y: number;
};

type PathSample = Pt & {
  angle: number;
  distance: number;
  progress: number;
};

type CarObject = {
  container: Phaser.GameObjects.Container;
  targetProgress: number;
  currentProgress: number;
  lane: number;
  colorHex: number;
  name: string;
};

type SceneryItem = {
  x: number;
  y: number;
  radius: number;
  kind: "tree" | "bush" | "rock";
  shade: number;
};

const MAP_W = 1000;
const MAP_H = 480;

const LAPS = 1;
// Wider track with four-player racing in mind.
const TRACK_LEFT = 220;
const TRACK_RIGHT = 780;

const TRACK_TOP = 90;
const TRACK_BOTTOM = 390;

const TRACK_CORNER_RADIUS = 100;

// Keep the existing road width.
const TRACK_HALF_WIDTH = 38;

const TRACK_INNER_RADIUS =
  TRACK_CORNER_RADIUS - TRACK_HALF_WIDTH;

const TRACK_OUTER_RADIUS =
  TRACK_CORNER_RADIUS + TRACK_HALF_WIDTH;

// Kerbs will be 1.5 times their previous 10-unit width.
const KERB_WIDTH = 15;



// Lane positions relative to the track centerline.
// Each lane is separated by 16 map units.


const GRASS = 0x347b45;
const ASPHALT = 0x343833;
const WHITE = 0xffffff;

const TREE_COLORS = [
  0x1b8f3c,
  0x167a33,
  0x0f6128,
];

const ROCK_COLORS = [
  0x8a8a8a,
  0x6e6e6e,
];

const BUSH_COLORS = [
  0x11652b,
  0x155b27,
  0x207a34,
];

const POND = {
  x: 700,
  y: 207,
  rx: 43,
  ry: 55,
};

const START_X = 345;
const FINISH_X = START_X;
const BOTTOM_Y = TRACK_BOTTOM;

const SCENERY_SEED = 824731;

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function distance(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function insideRoundedRect(
  x: number,
  y: number,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number
) {
  const nearestX = Phaser.Math.Clamp(
    x,
    left + radius,
    left + width - radius
  );

  const nearestY = Phaser.Math.Clamp(
    y,
    top + radius,
    top + height - radius
  );

  return (
    (x - nearestX) ** 2 + (y - nearestY) ** 2 <=
    radius ** 2
  );
}

export default class TrackScene extends Phaser.Scene {
  private W = 0;
  private H = 0;

  private mapScale = 1;
  private mapOffsetX = 0;
  private mapOffsetY = 0;

  private trackGraphics!: Phaser.GameObjects.Graphics;
  private pathSamples: PathSample[] = [];
  private totalPathLength = 0;

  private carsMap = new Map<string, CarObject>();
  private pendingPlayers: Player[] | null = null;

  private scenery: SceneryItem[] = [];
  // Solo mode displays two lanes by default.
  private visibleLaneCount = 2;

  constructor() {
    super({ key: "TrackScene" });
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;

    this.cameras.main.setBackgroundColor(GRASS);

    this.trackGraphics = this.add.graphics();
    this.trackGraphics.setDepth(0);

    this.generateScenery();
    this.buildPath();
    this.drawTrack();

    this.scale.on("resize", this.handleResize, this);
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.handleShutdown,
      this
    );

    if (this.pendingPlayers) {
      this.updatePlayers(this.pendingPlayers);
      this.pendingPlayers = null;
    }

    this.game.events.emit("track-scene-ready", this);
  }

  // --------------------------------------------------
  // RESPONSIVE MAP TRANSFORM
  // --------------------------------------------------

  private updateMapTransform() {
    const scaleX = this.W / MAP_W;
    const scaleY = this.H / MAP_H;

    this.mapScale = Math.min(scaleX, scaleY);


    this.mapOffsetX =
      (this.W - MAP_W * this.mapScale) / 2;

    this.mapOffsetY =
      (this.H - MAP_H * this.mapScale) / 2;
  }

  private toScreen(point: Pt): Pt {
    return {
      x: this.mapOffsetX + point.x * this.mapScale,
      y: this.mapOffsetY + point.y * this.mapScale,
    };
  }

  // --------------------------------------------------
  // RACE PATH
  //
  // Starts at x=275 on the bottom straight.
  // Direction: bottom -> right -> top -> left.
  // --------------------------------------------------

  private buildPath() {
    const points: Pt[] = [];

    const addLine = (
      start: Pt,
      end: Pt,
      steps: number
    ) => {
      for (let i = 0; i < steps; i++) {
        const t = i / steps;

        points.push({
          x: Phaser.Math.Linear(start.x, end.x, t),
          y: Phaser.Math.Linear(start.y, end.y, t),
        });
      }
    };

    const addArc = (
      cx: number,
      cy: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      steps: number
    ) => {
      for (let i = 0; i < steps; i++) {
        const t = i / steps;

        const angle = Phaser.Math.Linear(
          startAngle,
          endAngle,
          t
        );

        points.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        });
      }
    };

    // Expanded horizontal circuit.
    // Vertical dimensions and corner radius remain unchanged.
    const right = TRACK_RIGHT;
    const left = TRACK_LEFT;
    const top = TRACK_TOP;
    const bottom = TRACK_BOTTOM;
    const radius = TRACK_CORNER_RADIUS;

    // Bottom straight
    addLine(
      { x: START_X, y: bottom },
      { x: right, y: bottom },
      180
    );

    // Bottom-right corner
    addArc(
      right,
      bottom - radius,
      radius,
      Math.PI / 2,
      0,
      80
    );

    // Right vertical straight
    addLine(
      { x: right + radius, y: bottom - radius },
      { x: right + radius, y: top + radius },
      100
    );

    // Top-right corner
    addArc(
      right,
      top + radius,
      radius,
      0,
      -Math.PI / 2,
      80
    );

    // Top straight
    addLine(
      { x: right, y: top },
      { x: left, y: top },
      180
    );

    // Top-left corner
    addArc(
      left,
      top + radius,
      radius,
      -Math.PI / 2,
      -Math.PI,
      80
    );

    // Left vertical straight
    addLine(
      { x: left - radius, y: top + radius },
      { x: left - radius, y: bottom - radius },
      100
    );

    // Bottom-left corner
    addArc(
      left,
      bottom - radius,
      radius,
      Math.PI,
      Math.PI / 2,
      80
    );

    // Return to the start
    addLine(
      { x: left, y: bottom },
      { x: START_X, y: bottom },
      40
    );

    this.pathSamples = [];
    this.totalPathLength = 0;

    if (points.length < 2) return;

    const distances = [0];

    for (let i = 1; i < points.length; i++) {
      this.totalPathLength += distance(
        points[i - 1],
        points[i]
      );

      distances.push(this.totalPathLength);
    }

    this.pathSamples = points.map((point, index) => {
      const previous =
        points[
        (index - 1 + points.length) % points.length
        ];

      const next =
        points[(index + 1) % points.length];

      return {
        ...point,
        angle: Math.atan2(
          next.y - previous.y,
          next.x - previous.x
        ),
        distance: distances[index],
        progress:
          this.totalPathLength > 0
            ? distances[index] / this.totalPathLength
            : 0,
      };
    });
  }

  private samplePath(progress: number): PathSample {
    if (this.pathSamples.length === 0) {
      return {
        x: START_X,
        y: BOTTOM_Y,
        angle: 0,
        distance: 0,
        progress: 0,
      };
    }

    const normalized =
      ((progress % 1) + 1) % 1;

    const targetDistance =
      normalized * this.totalPathLength;

    let low = 0;
    let high = this.pathSamples.length - 1;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);

      if (
        this.pathSamples[mid].distance <
        targetDistance
      ) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const current = this.pathSamples[low];

    const previous =
      this.pathSamples[
      (low - 1 + this.pathSamples.length) %
      this.pathSamples.length
      ];

    const next =
      this.pathSamples[
      (low + 1) % this.pathSamples.length
      ];

    return {
      ...current,
      angle: Math.atan2(
        next.y - previous.y,
        next.x - previous.x
      ),
      progress: normalized,
    };
  }

  private getNormal(angle: number): Pt {
    return {
      x: -Math.sin(angle),
      y: Math.cos(angle),
    };
  }

  private offsetPoint(
    point: Pt,
    angle: number,
    offset: number
  ): Pt {
    const normal = this.getNormal(angle);

    return {
      x: point.x + normal.x * offset,
      y: point.y + normal.y * offset,
    };
  }

  // --------------------------------------------------
  // SEEDED SCENERY
  // --------------------------------------------------

  private generateScenery() {
    const random = createRandom(SCENERY_SEED);
    const items: SceneryItem[] = [];

    const pondDistance = (x: number, y: number) => {
      const dx = (x - POND.x) / POND.rx;
      const dy = (y - POND.y) / POND.ry;

      return Math.sqrt(dx * dx + dy * dy);
    };

    const insideInfield = (
      x: number,
      y: number,
      padding = 0
    ) => {
      const safePadding = Math.max(0, padding);

      const radius = Math.max(
        0,
        TRACK_INNER_RADIUS - safePadding
      );

      const width =
        TRACK_RIGHT -
        TRACK_LEFT +
        TRACK_INNER_RADIUS * 2 -
        safePadding * 2;

      const height =
        TRACK_BOTTOM -
        TRACK_TOP -
        TRACK_HALF_WIDTH * 2 -
        safePadding * 2;

      if (width <= 0 || height <= 0) {
        return false;
      }

      return insideRoundedRect(
        x,
        y,
        TRACK_LEFT -
        TRACK_INNER_RADIUS +
        safePadding,
        TRACK_TOP +
        TRACK_HALF_WIDTH +
        safePadding,
        width,
        height,
        radius
      );
    };

    // Includes the asphalt and both road boundaries.
    // Padding expands this area to protect nearby tree canopies.
    const insideTrackFootprint = (
      x: number,
      y: number,
      padding = 0
    ) => {
      const safePadding = Math.max(0, padding);
      const radius = TRACK_OUTER_RADIUS + safePadding;

      return insideRoundedRect(
        x,
        y,
        TRACK_LEFT -
        TRACK_OUTER_RADIUS -
        safePadding,
        TRACK_TOP -
        TRACK_HALF_WIDTH -
        safePadding,
        TRACK_RIGHT -
        TRACK_LEFT +
        TRACK_OUTER_RADIUS * 2 +
        safePadding * 2,
        TRACK_BOTTOM -
        TRACK_TOP +
        TRACK_HALF_WIDTH * 2 +
        safePadding * 2,
        radius
      );
    };

    const validPosition = (
      x: number,
      y: number,
      radius: number,
      outerMargin = false
    ) => {
      if (outerMargin) {
        // Keep scenery and its canopy completely outside the road.
        const padding = radius * 1.1 + 8;

        if (insideTrackFootprint(x, y, padding)) {
          return false;
        }

        // Prevent scenery from being clipped by map boundaries.
        const edgeMargin = radius * 1.1 + 3;

        if (
          x < edgeMargin ||
          x > MAP_W - edgeMargin ||
          y < edgeMargin ||
          y > MAP_H - edgeMargin
        ) {
          return false;
        }
      } else {
        // Keep infield scenery safely inside the inner grass.
        if (!insideInfield(x, y, radius * 1.1 + 2)) {
          return false;
        }
      }

      // Preserve the open space around the pond.
      if (
        pondDistance(x, y) <
        1 + radius / Math.max(POND.rx, POND.ry)
      ) {
        return false;
      }

      return true;
    };

    const addItems = (
      kind: SceneryItem["kind"],
      count: number,
      minX: number,
      maxX: number,
      minY: number,
      maxY: number,
      minRadius: number,
      maxRadius: number,
      shades: number[],
      forestOnly = false
    ) => {
      let created = 0;
      let attempts = 0;

      while (created < count && attempts < count * 100) {
        attempts++;

        const radius =
          minRadius +
          random() * (maxRadius - minRadius);

        const x =
          minX + random() * (maxX - minX);

        const y =
          minY + random() * (maxY - minY);

        if (!validPosition(x, y, radius, false)) {
          continue;
        }
        // Trees and rocks should not appear on the asphalt.
        if (
          !insideInfield(x, y, radius * 1.1 + 2) &&
          !forestOnly
        ) {
          continue;
        }
        // Keep every tree visually separate from nearby trees.
        // The canopy is wider than the tree's center radius.
        if (kind === "tree") {
          const candidate = { x, y };

          const overlapsTree = items.some((item) => {
            if (item.kind !== "tree") {
              return false;
            }

            const existing = {
              x: item.x,
              y: item.y,
            };

            const minDistance =
              (radius + item.radius) * 1.15 + 8;

            return distance(candidate, existing) < minDistance;
          });

          if (overlapsTree) {
            continue;
          }
        }

        items.push({
          x,
          y,
          radius,
          kind,
          shade:
            shades[
            Math.floor(random() * shades.length)
            ],
        });

        created++;
      }
    };
    // Place trees around the OUTSIDE of the circuit.
    // Each zone distributes trees across a different side of the map.
    const addOuterTrees = () => {
      const zones = [
        // Upper grass border
        {
          count: 7,
          minX: 130,
          maxX: 870,
          minY: 16,
          maxY: 27,
        },

        // Lower grass border
        {
          count: 7,
          minX: 130,
          maxX: 870,
          minY: 453,
          maxY: 464,
        },

        // Left grass border
        {
          count: 4,
          minX: 38,
          maxX: 55,
          minY: 125,
          maxY: 355,
        },

        // Right grass border
        {
          count: 4,
          minX: 945,
          maxX: 962,
          minY: 125,
          maxY: 355,
        },
      ];

      zones.forEach((zone) => {
        let placed = 0;
        let attempts = 0;

        while (
          placed < zone.count &&
          attempts < zone.count * 120
        ) {
          attempts++;

          const radius = 11 + random() * 4;

          const x =
            zone.minX +
            random() * (zone.maxX - zone.minX);

          const y =
            zone.minY +
            random() * (zone.maxY - zone.minY);

          // Strictly reject positions on or too close to the road.
          if (!validPosition(x, y, radius, true)) {
            continue;
          }

          // Prevent the tree canopy from merging with nearby scenery.
          const candidate = { x, y };

          const overlaps = items.some((item) => {
            const minimumDistance =
              (radius + item.radius) * 1.15 + 8;

            return (
              distance(candidate, item) < minimumDistance
            );
          });

          if (overlaps) {
            continue;
          }

          items.push({
            x,
            y,
            radius,
            kind: "tree",
            shade:
              TREE_COLORS[
              Math.floor(random() * TREE_COLORS.length)
              ],
          });

          placed++;
        }
      });
    };



    addItems(
      "bush",
      18,
      185,
      625,
      110,
      350,
      5,
      10,
      BUSH_COLORS,
      true
    );
    // Distribute rocks evenly in a grid, with small random variations.
    // Reject positions that overlap trees, other rocks, or the pond.
    const addDistributedRocks = () => {
      const columns = 6;
      const rows = 4;

      const minX = 180;
      const maxX = 820;
      const minY = 140;
      const maxY = 340;

      const cellWidth = (maxX - minX) / columns;
      const cellHeight = (maxY - minY) / rows;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          let placed = false;

          // Try several positions within each grid cell.
          for (let attempt = 0; attempt < 35 && !placed; attempt++) {
            // Mix tiny, small, and larger rocks.
            const radius = 3 + random() * 7;

            // Slight random variation keeps the layout natural.
            const x =
              minX +
              col * cellWidth +
              cellWidth * (0.12 + random() * 0.76);

            const y =
              minY +
              row * cellHeight +
              cellHeight * (0.12 + random() * 0.76);

            // Keep rocks inside the infield and away from the pond.
            if (!validPosition(x, y, radius, false)) {
              continue;
            }

            const overlaps = items.some((item) => {
              let minimumDistance = 0;

              if (item.kind === "tree") {
                // Account for the tree's wider canopy.
                minimumDistance =
                  item.radius * 1.75 + radius + 6;
              } else if (item.kind === "rock") {
                // Keep adjacent rocks visually separate.
                minimumDistance =
                  (item.radius + radius) * 1.25 + 5;
              }

              return (
                minimumDistance > 0 &&
                distance({ x, y }, item) < minimumDistance
              );
            });

            if (overlaps) {
              continue;
            }

            items.push({
              x,
              y,
              radius,
              kind: "rock",
              shade:
                ROCK_COLORS[
                Math.floor(random() * ROCK_COLORS.length)
                ],
            });

            placed = true;
          }
        }
      }
    };






    // A few small objects outside the track.
    // Small decorative bushes outside the asphalt.
    // Fixed locations keep the scenery deterministic.
    const borderBushes = [
      { x: 160, y: 13, radius: 5 },
      { x: 420, y: 13, radius: 6 },
      { x: 720, y: 13, radius: 4 },
      { x: 240, y: 467, radius: 5 },
      { x: 550, y: 467, radius: 4 },
      { x: 860, y: 467, radius: 6 },
    ];
    // Place rocks across the infield after trees have been generated.
    addDistributedRocks();

    borderBushes.forEach((bush, index) => {
      items.push({
        ...bush,
        kind: "bush",
        shade: BUSH_COLORS[index % BUSH_COLORS.length],
      });
    });
    // Add outer trees after bushes so the spacing check sees them.
    addOuterTrees();

    this.scenery = items;

  }

  // --------------------------------------------------
  // MAP DRAWING
  // --------------------------------------------------

  private drawTree(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
    shade: number
  ): void {
    // Soft ground shadow
    g.fillStyle(0x263b25, 0.24);
    g.fillEllipse(
      x + size * 0.12,
      y + size * 0.24,
      size * 2.0,
      size * 1.55
    );

    // Dark outer canopy
    g.fillStyle(0x24452b, 1);
    g.fillCircle(x, y, size);

    g.fillCircle(
      x - size * 0.42,
      y - size * 0.12,
      size * 0.61
    );

    g.fillCircle(
      x + size * 0.38,
      y - size * 0.30,
      size * 0.66
    );

    g.fillCircle(
      x + size * 0.30,
      y + size * 0.38,
      size * 0.55
    );

    g.fillCircle(
      x - size * 0.34,
      y + size * 0.37,
      size * 0.57
    );

    // Main foliage
    g.fillStyle(shade, 1);
    g.fillCircle(
      x - size * 0.12,
      y - size * 0.16,
      size * 0.70
    );

    g.fillCircle(
      x + size * 0.31,
      y + size * 0.04,
      size * 0.53
    );

    g.fillCircle(
      x - size * 0.24,
      y + size * 0.34,
      size * 0.48
    );

    // Sunlit leaf clusters
    g.fillStyle(0x527c43, 0.95);
    g.fillCircle(
      x - size * 0.28,
      y - size * 0.37,
      size * 0.28
    );

    g.fillCircle(
      x + size * 0.18,
      y - size * 0.43,
      size * 0.24
    );

    g.fillCircle(
      x + size * 0.42,
      y - size * 0.04,
      size * 0.21
    );

    g.fillCircle(
      x - size * 0.12,
      y + size * 0.18,
      size * 0.25
    );
  }

  private drawBush(
    g: Phaser.GameObjects.Graphics,
    item: SceneryItem
  ) {
    g.fillStyle(item.shade, 1);

    g.fillCircle(
      item.x,
      item.y,
      item.radius
    );

    g.fillCircle(
      item.x + item.radius * 0.65,
      item.y + item.radius * 0.15,
      item.radius * 0.7
    );

    g.fillCircle(
      item.x - item.radius * 0.6,
      item.y + item.radius * 0.2,
      item.radius * 0.65
    );
  }

  private drawRock(
    g: Phaser.GameObjects.Graphics,
    item: SceneryItem
  ) {
    const { x, y, radius, shade } = item;

    // Soft shadow beneath each rock.
    g.fillStyle(0x202820, 0.25);
    g.fillEllipse(
      x + radius * 0.15,
      y + radius * 0.3,
      radius * 2.4,
      radius * 1.25
    );

    // Dark outline gives each rock a defined silhouette.
    g.fillStyle(0x454a43, 1);
    g.beginPath();
    g.moveTo(x - radius, y - radius * 0.15);
    g.lineTo(x - radius * 0.4, y - radius);
    g.lineTo(x + radius * 0.55, y - radius * 0.8);
    g.lineTo(x + radius, y + radius * 0.1);
    g.lineTo(x + radius * 0.35, y + radius * 0.8);
    g.lineTo(x - radius * 0.7, y + radius * 0.55);
    g.closePath();
    g.fillPath();

    // Main surface.
    g.fillStyle(shade, 1);
    g.beginPath();
    g.moveTo(x - radius * 0.78, y - radius * 0.12);
    g.lineTo(x - radius * 0.3, y - radius * 0.72);
    g.lineTo(x + radius * 0.48, y - radius * 0.55);
    g.lineTo(x + radius * 0.75, y + radius * 0.1);
    g.lineTo(x + radius * 0.25, y + radius * 0.62);
    g.lineTo(x - radius * 0.55, y + radius * 0.42);
    g.closePath();
    g.fillPath();

    // Subtle highlight on the upper surface.
    g.fillStyle(0xc2c4b7, 0.55);
    g.beginPath();
    g.moveTo(x - radius * 0.3, y - radius * 0.65);
    g.lineTo(x + radius * 0.35, y - radius * 0.5);
    g.lineTo(x - radius * 0.02, y - radius * 0.12);
    g.lineTo(x - radius * 0.55, y - radius * 0.2);
    g.closePath();
    g.fillPath();
  }

  private drawPond(g: Phaser.GameObjects.Graphics) {
    // Shoreline.
    g.fillStyle(0x579ba8, 1);
    g.fillEllipse(
      POND.x,
      POND.y,
      POND.rx * 2 + 6,
      POND.ry * 2 + 6
    );

    // Water.
    g.fillStyle(0x00a2e8, 1);
    g.fillEllipse(
      POND.x,
      POND.y,
      POND.rx * 2,
      POND.ry * 2
    );

    // Lily pads.
    const lilyPads = [
      { x: 683, y: 174, r: 6 },
      { x: 720, y: 181, r: 7 },
      { x: 686, y: 213, r: 5 },
      { x: 718, y: 229, r: 6 },
    ];

    lilyPads.forEach((pad) => {
      g.fillStyle(0x207a34, 1);
      g.fillCircle(pad.x, pad.y, pad.r);

      // Opening in the lily pad.
      g.fillStyle(0x00a2e8, 1);
      g.fillTriangle(
        pad.x,
        pad.y,
        pad.x + pad.r,
        pad.y - pad.r * 0.6,
        pad.x + pad.r,
        pad.y + pad.r * 0.6
      );
    });

    // Reeds around the shoreline.
    g.lineStyle(2, 0x155b27, 1);

    const reeds = [
      { x: 668, y: 176 },
      { x: 670, y: 183 },
      { x: 733, y: 202 },
      { x: 731, y: 210 },
    ];

    reeds.forEach((reed) => {
      g.beginPath();
      g.moveTo(reed.x, reed.y + 8);
      g.lineTo(reed.x + 2, reed.y - 4);
      g.strokePath();
    });

    // Shoreline stones.
    g.fillStyle(0x8a8a8a, 1);
    g.fillEllipse(659, 221, 8, 5);
    g.fillEllipse(715, 154, 7, 5);
    g.fillEllipse(744, 202, 6, 5);
  }


  private drawGrassBackground(
    g: Phaser.GameObjects.Graphics
  ) {
    // Base grass.
    g.fillStyle(GRASS, 1);
    g.fillRect(0, 0, MAP_W, MAP_H);

    // Subtle grass patches.
    g.fillStyle(0x3e844a, 1);
    g.fillEllipse(115, 100, 60, 35);
    g.fillEllipse(870, 70, 70, 25);
    g.fillEllipse(845, 380, 80, 25);
    g.fillEllipse(120, 370, 55, 30);
  }

  private drawScenery(g: Phaser.GameObjects.Graphics) {
    // Draw scenery objects according to their type.
    this.scenery.forEach((item) => {
      switch (item.kind) {
        case "tree":
          this.drawTree(
            g,
            item.x,
            item.y,
            item.radius,
            item.shade
          );
          break;

        case "bush":
          this.drawBush(g, item);
          break;

        case "rock":
          this.drawRock(g, item);
          break;
      }
    });

    // Draw pond details after the infield scenery.
    this.drawPond(g);
  }




  private drawTrack() {
    const g = this.trackGraphics;

    g.clear();

    this.updateMapTransform();

    g.setPosition(this.mapOffsetX, this.mapOffsetY);
    g.setScale(this.mapScale);

    // 1. Grass background
    this.drawGrassBackground(g);

    // 2. Wider asphalt track
    const outerRadius = TRACK_OUTER_RADIUS;

    const outerLeft = TRACK_LEFT - outerRadius;
    const outerTop = TRACK_TOP - TRACK_HALF_WIDTH;

    const outerWidth =
      TRACK_RIGHT - TRACK_LEFT + outerRadius * 2;

    const outerHeight =
      TRACK_BOTTOM - TRACK_TOP + TRACK_HALF_WIDTH * 2;

    g.fillStyle(ASPHALT, 1);

    g.fillRoundedRect(
      outerLeft,
      outerTop,
      outerWidth,
      outerHeight,
      outerRadius
    );

    // 3. Inner grass island.
    // Its edges match the inside edge of the wider road.
    const innerRadius = TRACK_INNER_RADIUS;

    const innerLeft = TRACK_LEFT - innerRadius;
    const innerTop = TRACK_TOP + TRACK_HALF_WIDTH;

    const innerWidth =
      TRACK_RIGHT - TRACK_LEFT + innerRadius * 2;

    const innerHeight =
      TRACK_BOTTOM -
      TRACK_TOP -
      TRACK_HALF_WIDTH * 2;

    g.fillStyle(0x3b8048, 1);

    g.fillRoundedRect(
      innerLeft,
      innerTop,
      innerWidth,
      innerHeight,
      innerRadius
    );

    // 4. Existing trees, rocks, bushes and pond
    this.drawScenery(g);

    // 5. Road details
    this.drawKerbs(g);
    this.drawTrackMarkings(g);
    this.drawStartFinish(g);
    this.drawDirectionArrow(g);
  }



  private drawKerbs(
    g: Phaser.GameObjects.Graphics
  ) {
    const corners = [
      {
        x: TRACK_RIGHT,
        y: TRACK_TOP + TRACK_CORNER_RADIUS,
        start: 0,
      },
      {
        x: TRACK_LEFT,
        y: TRACK_TOP + TRACK_CORNER_RADIUS,
        start: -Math.PI / 2,
      },
      {
        x: TRACK_LEFT,
        y: TRACK_BOTTOM - TRACK_CORNER_RADIUS,
        start: Math.PI,
      },
      {
        x: TRACK_RIGHT,
        y: TRACK_BOTTOM - TRACK_CORNER_RADIUS,
        start: Math.PI / 2,
      },
    ];

    corners.forEach((corner) => {
      const cx = corner.x;
      const cy = corner.y;

      const start = corner.start;
      const end = start - Math.PI / 2;

      const steps = 24;

      for (let i = 0; i < steps; i++) {
        const a0 =
          start + ((end - start) * i) / steps;

        const a1 =
          start + ((end - start) * (i + 1)) / steps;

        // Narrow red-and-white kerbs along the inside road edge.
        const innerR = TRACK_INNER_RADIUS;
        const outerR = innerR + KERB_WIDTH;

        const points = [
          {
            x: cx + Math.cos(a0) * innerR,
            y: cy + Math.sin(a0) * innerR,
          },
          {
            x: cx + Math.cos(a1) * innerR,
            y: cy + Math.sin(a1) * innerR,
          },
          {
            x: cx + Math.cos(a1) * outerR,
            y: cy + Math.sin(a1) * outerR,
          },
          {
            x: cx + Math.cos(a0) * outerR,
            y: cy + Math.sin(a0) * outerR,
          },
        ];

        g.fillStyle(
          i % 2 === 0 ? 0xb93e32 : WHITE,
          1
        );

        g.beginPath();
        g.moveTo(points[0].x, points[0].y);

        points.slice(1).forEach((point) => {
          g.lineTo(point.x, point.y);
        });

        g.closePath();
        g.fillPath();
      }
    });
  }
  private drawTrackMarkings(
    g: Phaser.GameObjects.Graphics
  ) {
    // Outer road boundary.
    const outerRadius = TRACK_OUTER_RADIUS;

    g.lineStyle(1.5, WHITE, 1);

    g.strokeRoundedRect(
      TRACK_LEFT - outerRadius,
      TRACK_TOP - TRACK_HALF_WIDTH,
      TRACK_RIGHT -
      TRACK_LEFT +
      outerRadius * 2,
      TRACK_BOTTOM -
      TRACK_TOP +
      TRACK_HALF_WIDTH * 2,
      outerRadius
    );

    // Inner road boundary.
    const innerRadius = TRACK_INNER_RADIUS;

    g.strokeRoundedRect(
      TRACK_LEFT - innerRadius,
      TRACK_TOP + TRACK_HALF_WIDTH,
      TRACK_RIGHT -
      TRACK_LEFT +
      innerRadius * 2,
      TRACK_BOTTOM -
      TRACK_TOP -
      TRACK_HALF_WIDTH * 2,
      innerRadius
    );

    // Stop if the racing path is not ready.
    if (
      this.pathSamples.length < 2 ||
      this.totalPathLength <= 0
    ) {
      return;
    }

    // Calculate lane positions from the active lane count.
    const laneCount = this.visibleLaneCount;

    const laneWidth =
      (TRACK_HALF_WIDTH * 2) / laneCount;

    const dash = 12;
    const gap = 10;
    const step = dash + gap;

    g.lineStyle(2, WHITE, 0.78);

    // Draw exactly one separator between adjacent lanes.
    for (
      let divider = 1;
      divider < laneCount;
      divider++
    ) {
      const offset =
        -TRACK_HALF_WIDTH + divider * laneWidth;

      for (
        let d = 0;
        d + dash <= this.totalPathLength;
        d += step
      ) {
        const startSample = this.samplePath(
          d / this.totalPathLength
        );

        const endSample = this.samplePath(
          (d + dash) / this.totalPathLength
        );

        // Follow the track through its corners.
        const start = this.offsetPoint(
          startSample,
          startSample.angle,
          offset
        );

        const end = this.offsetPoint(
          endSample,
          endSample.angle,
          offset
        );

        g.beginPath();
        g.moveTo(start.x, start.y);
        g.lineTo(end.x, end.y);
        g.strokePath();
      }
    }
  }


  private drawStartFinish(
    g: Phaser.GameObjects.Graphics
  ) {
    // Large red-and-white checkered finish line.
    const squareSize = 6;
    const columns = 4;
    const stripeWidth = columns * squareSize;
    const stripeHeight = TRACK_HALF_WIDTH * 2;
    const rows = Math.ceil(stripeHeight / squareSize);
    const rowHeight = stripeHeight / rows;

    const stripeX = FINISH_X - stripeWidth / 2;
    const stripeY = BOTTOM_Y - TRACK_HALF_WIDTH;

    // Dark border.
    g.fillStyle(0x171915, 1);
    g.fillRect(
      stripeX - 1,
      stripeY - 1,
      stripeWidth + 2,
      stripeHeight + 2
    );

    // Checkerboard pattern.
    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        g.fillStyle(
          (row + col) % 2 === 0 ? WHITE : 0xb93e32,
          1
        );

        g.fillRect(
          stripeX + col * squareSize,
          stripeY + row * rowHeight,
          squareSize + 0.15,
          rowHeight + 0.15
        );
      }
    }
  }




  private drawDirectionArrow(
    g: Phaser.GameObjects.Graphics
  ) {
    const x = START_X + 80;
    const y = BOTTOM_Y;
    g.fillStyle(WHITE, 1);

    g.beginPath();
    g.moveTo(x + 12, y);
    g.lineTo(x - 4, y - 7);
    g.lineTo(x - 4, y - 3);
    g.lineTo(x - 15, y - 3);
    g.lineTo(x - 15, y + 3);
    g.lineTo(x - 4, y + 3);
    g.lineTo(x - 4, y + 7);
    g.closePath();

    g.fillPath();
  }

  // --------------------------------------------------
  // CAR GRAPHICS AND MOVEMENT
  // --------------------------------------------------

  private createCar(
    player: Player,
    initialProgress: number
  ): CarObject {
    const lane = player.lane ?? this.carsMap.size;

    const colorHex =
      player.colorHex ??
      CAR_COLORS[
      ((lane % CAR_COLORS.length) + CAR_COLORS.length) %
      CAR_COLORS.length
      ];

    const container = this.add.container(0, 0);
    container.setDepth(10);

    const carGraphics = this.add.graphics();

    // Soft shadow beneath the car.
    carGraphics.fillStyle(0x171915, 0.22);
    carGraphics.fillRoundedRect(-15, -8, 30, 16, 5);

    // Main car body — rounded front and rear.
    carGraphics.fillStyle(colorHex, 1);
    carGraphics.fillRoundedRect(-14, -7, 27, 14, 4);

    // Rounded front bumper.
    carGraphics.fillStyle(colorHex, 1);
    carGraphics.fillRoundedRect(10, -5.5, 5, 11, 2);

    // Front splitter.
    carGraphics.fillStyle(0x242622, 1);
    carGraphics.fillRoundedRect(13, -7, 3, 14, 1);

    // Rear wing.
    carGraphics.fillStyle(0x242622, 1);
    carGraphics.fillRoundedRect(-15, -8, 4, 16, 1);

    // Rear wing supports.
    carGraphics.fillStyle(0x242622, 1);
    carGraphics.fillRect(-12, -5, 2, 10);

    // Cockpit surround.
    carGraphics.fillStyle(0x252a28, 1);
    carGraphics.fillRoundedRect(-6, -5, 12, 10, 4);

    // Driver cockpit glass.
    carGraphics.fillStyle(0x34474a, 1);
    carGraphics.fillRoundedRect(-4, -4, 8, 8, 3);

    // Windscreen reflection.
    carGraphics.fillStyle(0xb9ccc8, 0.65);
    carGraphics.fillRoundedRect(0, -2.5, 3, 5, 1);

    // Front headlights.
    carGraphics.fillStyle(0xf4f2ec, 1);
    carGraphics.fillRoundedRect(11, -4, 2, 2, 0.7);
    carGraphics.fillRoundedRect(11, 2, 2, 2, 0.7);

    const label = this.add.text(
      0,
      16,
      player.name,
      {
        fontFamily: "Instrument Sans, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#242621",
        backgroundColor: "#FCFBF8",
        padding: {
          x: 4,
          y: 2,
        },
      }
    );

    label.setOrigin(0.5, 0);

    container.add([carGraphics, label]);

    return {
      container,
      targetProgress: initialProgress,
      currentProgress: initialProgress,
      lane,
      colorHex,
      name: player.name,
    };
  }

  private positionCar(car: CarObject) {
    if (this.pathSamples.length === 0) {
      return;
    }

    const sample = this.samplePath(
      car.currentProgress * LAPS
    );

    const normal = this.getNormal(sample.angle);

    // Keep player ordering consistent with assigned lane order.
    const orderedCars = Array.from(
      this.carsMap.values()
    ).sort((a, b) => a.lane - b.lane);

    // Include the car during initial positioning if needed.
    if (!orderedCars.includes(car)) {
      orderedCars.push(car);
      orderedCars.sort((a, b) => a.lane - b.lane);
    }

    const carIndex = orderedCars.indexOf(car);

    // Use the same lane count as the visible road markings.
    const laneCount = this.visibleLaneCount;

    const laneWidth =
      (TRACK_HALF_WIDTH * 2) / laneCount;

    // Place the car at the center of its assigned visual lane.
    const laneIndex = Phaser.Math.Clamp(
      carIndex,
      0,
      laneCount - 1
    );

    const laneOffset =
      -TRACK_HALF_WIDTH +
      laneWidth * (laneIndex + 0.5);

    // Enlarge the car while retaining a gap between adjacent cars.
    // Maximum height across the track: 24 map units.
    const carVisualWidth = Math.min(
      24,
      laneWidth * 0.92
    );

    const carGraphics = car.container.getAt(
      0
    ) as Phaser.GameObjects.Graphics;

    // A longer car with height dynamically fitted to its lane.
    carGraphics.setScale(
      1.65,
      carVisualWidth / 16
    );

    const position = this.toScreen({
      x: sample.x + normal.x * laneOffset,
      y: sample.y + normal.y * laneOffset,
    });

    car.container.setPosition(
      position.x,
      position.y
    );

    car.container.setScale(this.mapScale);
    car.container.setRotation(sample.angle);

    // Keep the player name readable and outside the car body.
    const label = car.container.getAt(
      1
    ) as Phaser.GameObjects.Text;

    if (label) {
      label.setPosition(
        0,
        carVisualWidth / 2 + 3
      );

      label.setRotation(-sample.angle);
    }
  }

  updatePlayers(
  players: Player[],
  isMultiplayer = players.length > 1
) {

    if (!this.scene.isActive()) {
      this.pendingPlayers = players;
      return;
    }
    // Adjust the number of visible lanes to the active roster.
    // Solo practice always keeps the two-lane layout.
    const nextLaneCount = Math.min(
      4,
      Math.max(2, players.length)
    );

    if (nextLaneCount !== this.visibleLaneCount) {
      this.visibleLaneCount = nextLaneCount;
      this.drawTrack();
    }

    const incomingIds = new Set(
      players.map((player) => player.id)
    );

    this.carsMap.forEach((car, id) => {
      if (!incomingIds.has(id)) {
        car.container.destroy(true);
        this.carsMap.delete(id);
      }
    });

    players.forEach((player, index) => {
      const progress = Phaser.Math.Clamp(
        player.progressRatio ?? 0,
        0,
        0.999
      );

      const existingCar = this.carsMap.get(player.id);

      if (existingCar) {
        existingCar.targetProgress = Math.max(
          existingCar.targetProgress,
          progress
        );

        existingCar.name = player.name;
        existingCar.lane =
          player.lane != null
            ? player.lane
            : players.findIndex((p) => p.id === player.id);

        const label = existingCar.container.getAt(
          1
        ) as Phaser.GameObjects.Text;

        if (label?.setText) {
          label.setText(player.name);

        }
      } else {
        const car = this.createCar(player, progress);

        car.lane =
          player.lane != null
            ? player.lane
            : index;

        this.carsMap.set(player.id, car);
      }
    });
  // Position cars after all lane assignments are updated.
this.carsMap.forEach((car) => {
  this.positionCar(car);
});

// Show names above cars only in solo practice.
this.carsMap.forEach((car) => {
  const label = car.container.getAt(
    1
  ) as Phaser.GameObjects.Text;

  if (label) {
    label.setVisible(!isMultiplayer);
  }
});

// Keep names above cars in solo mode only.
const showTrackNames = players.length <= 1;

this.carsMap.forEach((car) => {
  const label = car.container.getAt(
    1
  ) as Phaser.GameObjects.Text;

  if (label) {
    label.setVisible(showTrackNames);
  }
});
  }

  update(
    _time: number,
    delta: number
  ) {
    const movementFactor = Math.min(1, delta / 100);

    this.carsMap.forEach((car) => {
      const difference =
        car.targetProgress - car.currentProgress;

      if (difference > 0) {
        car.currentProgress +=
          difference * movementFactor;
      }

      this.positionCar(car);
    });
  }
  private handleShutdown() {
    this.scale.off("resize", this.handleResize, this);

    this.carsMap.clear();
    this.pendingPlayers = null;
  }

  // --------------------------------------------------
  // RESIZE
  // --------------------------------------------------

  private handleResize(
    gameSize: Phaser.Structs.Size
  ) {
    this.W = gameSize.width;
    this.H = gameSize.height;

    this.drawTrack();

    this.carsMap.forEach((car) => {
      this.positionCar(car);
    });
  }
}

