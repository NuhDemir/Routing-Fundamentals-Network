import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  PcCase,
  Server,
  Award,
  Clock,
  Pause,
  RotateCcw,
  Settings,
  AlertTriangle,
  Play,
  Target,
  BookOpen,
  ChevronRight,
  Info,
  Mail,
} from "lucide-react";

/**
 * Network Routing Academy
 * Tek dosyalık, çalışır bir React uygulaması.
 * - 3 senaryo (başlangıç, çoklu yol, felaket/failover)
 * - Static / RIP / OSPF / (opsiyonel basitleştirilmiş) BGP seçimleri
 * - En uzun prefix eşleşmesi, hop sayısı, ağırlıklı maliyet ve failover mantığı
 * - Canlı topoloji, loglar, skor ve eğitim ipuçları
 *
 * Not: Tailwind + lucide-react ile tasarlanmıştır. Varsayılan export bir React bileşenidir.
 */

// ----------------------------- OYUN VERİLERİ ------------------------------ //

const LEVELS = {
  1: {
    id: 1,
    title: "Başlangıç: İlk Paketinizi Gönderin",
    description: "Basit bir ağda routing nasıl çalışır öğrenin.",
    scenario:
      "Yeni IT uzmanısınız. Geliştirici bilgisayarından test sunucusuna bir mesaj gönderin.",
    points: 100,
  },
  2: {
    id: 2,
    title: "Çoklu Yollar: En İyi Rotayı Seçin",
    description: "Birden fazla yol varken router nasıl karar verir?",
    scenario:
      "Trafik yoğun. Router birden fazla yol arasında seçim yapmalı. Metric ve cost değerlerini anlayın.",
    points: 200,
  },
  3: {
    id: 3,
    title: "Felaket: Yedek Rotalar",
    description: "Ana bağlantı koptuğunda yedek rotalar devreye girer.",
    scenario:
      "ACİL! Birincil bağlantı koptu. Yedek bağlantıları kullanarak trafiği yönlendirin.",
    points: 300,
  },
};

const PROTOCOLS = {
  static: {
    label: "Static",
    explain: "Manuel route; en uzun prefix + en düşük metric.",
  },
  rip: { label: "RIP", explain: "Hop sayısı en az olan yol tercih edilir." },
  ospf: {
    label: "OSPF",
    explain: "Toplam cost (weight) en düşük olan yol tercih edilir.",
  },
  bgp: {
    label: "BGP (Basitleştirilmiş)",
    explain: "LOCAL_PREF > AS-PATH uzunluğu. Eğitim amaçlı sadeleştirilmiştir.",
  },
};

// ----------------------------- TOPOLOJİ ------------------------------ //
// Düğümler ızgarada konumlandırılır. link.cost milisaniye tabanlı gecikme.
// status: "up" | "down"

function makeTopology(level) {
  // Ortak IP'ler
  const DEV_IP = `192.168.1.${10 + level}`;
  const SRV_IP = `192.168.2.${20 + level}`;

  // Düğümler
  const nodes = {
    dev: { id: "dev", name: "Dev PC", ip: DEV_IP, type: "host", x: 8, y: 3 },
    r1: {
      id: "r1",
      name: "Router-1",
      ip: "10.0.0.1",
      type: "router",
      x: 26,
      y: 11,
    },
    r2:
      level >= 2
        ? {
            id: "r2",
            name: "Router-2",
            ip: "10.0.0.2",
            type: "router",
            x: 52,
            y: 11,
          }
        : null,
    isp:
      level >= 2
        ? {
            id: "isp",
            name: "ISP Edge",
            ip: "172.16.0.1",
            type: "router",
            x: 40,
            y: 3,
          }
        : null,
    srv: {
      id: "srv",
      name: "Prod Server",
      ip: SRV_IP,
      type: "host",
      x: 78,
      y: 3,
    },
  };

  // Linkler (yönsüz)
  // cost: OSPF için ağırlık, delay: animasyon ve log beklemesi
  const links = [
    { a: "dev", b: "r1", id: "dev-r1", cost: 1, delay: 600, status: "up" },
  ];

  if (level === 1) {
    links.push({
      a: "r1",
      b: "srv",
      id: "r1-srv",
      cost: 2,
      delay: 800,
      status: "up",
    });
  }

  if (level >= 2) {
    links.push({
      a: "r1",
      b: "r2",
      id: "r1-r2",
      cost: 2,
      delay: 700,
      status: "up",
    });
    links.push({
      a: "r2",
      b: "srv",
      id: "r2-srv",
      cost: 2,
      delay: 700,
      status: "up",
    });

    // Alternatif yol: r1 -> isp -> srv (daha pahalı)
    links.push({
      a: "r1",
      b: "isp",
      id: "r1-isp",
      cost: 5,
      delay: 900,
      status: "up",
    });
    links.push({
      a: "isp",
      b: "srv",
      id: "isp-srv",
      cost: 5,
      delay: 900,
      status: "up",
    });
  }

  if (level === 3) {
    // Felaket: r1 -> r2 birincil hat down olsun (kullanıcı failover görsün)
    // veya r2->srv down. Burada r1-r2'yi down yapalım:
    const idx = links.findIndex((l) => l.id === "r1-r2");
    if (idx >= 0) links[idx] = { ...links[idx], status: "down" };
  }

  // Router-1 routing tabloları (Static için örnek)
  const r1Routes = [];
  if (level === 1) {
    r1Routes.push(
      {
        prefix: "192.168.1.0/24",
        iface: "dev",
        nextHop: "connected",
        metric: 0,
        note: "LAN",
      },
      {
        prefix: "192.168.2.0/24",
        iface: "srv",
        nextHop: "direct",
        metric: 1,
        note: "Direct link",
      },
      {
        prefix: "0.0.0.0/0",
        iface: "srv",
        nextHop: "default",
        metric: 10,
        note: "Default",
      }
    );
  } else if (level === 2) {
    r1Routes.push(
      {
        prefix: "192.168.2.0/24",
        iface: "r2",
        nextHop: "10.0.0.2",
        metric: 1,
        note: "Primary",
      },
      {
        prefix: "192.168.2.0/24",
        iface: "isp",
        nextHop: "172.16.0.1",
        metric: 3,
        note: "Backup",
      },
      {
        prefix: "0.0.0.0/0",
        iface: "isp",
        nextHop: "172.16.0.1",
        metric: 10,
        note: "Default",
      }
    );
  } else if (level === 3) {
    r1Routes.push(
      // Primary route arızalı olsa da tabloda var; interface DOWN -> failover'a gidecek
      {
        prefix: "192.168.2.0/24",
        iface: "r2",
        nextHop: "10.0.0.2",
        metric: 1,
        note: "Primary (down)",
      },
      {
        prefix: "192.168.2.0/24",
        iface: "isp",
        nextHop: "172.16.0.1",
        metric: 5,
        note: "Backup via ISP",
      },
      {
        prefix: "0.0.0.0/0",
        iface: "isp",
        nextHop: "172.16.0.1",
        metric: 20,
        note: "Default",
      }
    );
  }

  // BGP (basit): LOCAL_PREF (internal) > external, sonra AS-PATH length
  // r1->r2->srv = internal (LOCAL_PREF 200), as-path [65001]
  // r1->isp->srv = external (LOCAL_PREF 100), as-path [65050, 65002]
  const bgpPaths =
    level >= 2
      ? [
          {
            path: ["r1", "r2", "srv"],
            localPref: 200,
            asPath: [65001],
            note: "Internal path via R2",
          },
          {
            path: ["r1", "isp", "srv"],
            localPref: 100,
            asPath: [65050, 65002],
            note: "External via ISP",
          },
        ]
      : [
          {
            path: ["r1", "srv"],
            localPref: 200,
            asPath: [65001],
            note: "Direct",
          },
        ];

  return {
    nodes: Object.fromEntries(Object.entries(nodes).filter(([, v]) => v)),
    links,
    r1Routes,
    bgpPaths,
    DEV_IP,
    SRV_IP,
  };
}

// ----------------------------- YARDIMCILAR ------------------------------ //

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function longestPrefixMatch(prefixes, ip) {
  // Çok basit: /24 kalıbına göre, string karşılaştırmalı
  // Eğitim amaçlı olduğu için yalnızca /24 ve /0 varsayımı yeterlidir.
  const pick = prefixes
    .map((p) => {
      const [net, maskStr] = p.prefix.split("/");
      const mask = Number(maskStr);
      return { ...p, net, mask };
    })
    .sort((a, b) => b.mask - a.mask)
    .find((p) => {
      if (p.mask === 0) return true;
      const targetNet = ip.split(".").slice(0, 3).join(".") + ".0";
      return p.net === targetNet;
    });
  return pick || null;
}

function dijkstraPath(nodes, links, startId, endId) {
  // OSPF benzetimi: cost ağırlıklı en kısa yol
  const adj = {};
  Object.values(nodes).forEach((n) => (adj[n.id] = []));
  links.forEach((l) => {
    if (l.status !== "up") return;
    adj[l.a].push({ to: l.b, cost: l.cost, link: l });
    adj[l.b].push({ to: l.a, cost: l.cost, link: l });
  });

  const dist = {};
  const prev = {};
  const used = new Set();
  Object.keys(adj).forEach((k) => (dist[k] = Infinity));
  dist[startId] = 0;

  while (true) {
    let u = null;
    let best = Infinity;
    Object.keys(dist).forEach((k) => {
      if (!used.has(k) && dist[k] < best) {
        best = dist[k];
        u = k;
      }
    });
    if (!u) break;
    if (u === endId) break;
    used.add(u);
    adj[u].forEach(({ to, cost }) => {
      if (dist[u] + cost < dist[to]) {
        dist[to] = dist[u] + cost;
        prev[to] = u;
      }
    });
  }

  if (!prev[endId] && startId !== endId) return null;
  const path = [endId];
  let cur = endId;
  while (cur !== startId) {
    cur = prev[cur];
    if (!cur) return null;
    path.push(cur);
  }
  path.reverse();
  return path;
}

function hopCountPath(nodes, links, startId, endId) {
  // RIP benzetimi: en az hop sayısı (BFS)
  const adj = {};
  Object.values(nodes).forEach((n) => (adj[n.id] = []));
  links.forEach((l) => {
    if (l.status !== "up") return;
    adj[l.a].push(l.b);
    adj[l.b].push(l.a);
  });

  const q = [startId];
  const prev = { [startId]: null };
  let head = 0;
  while (head < q.length) {
    const u = q[head++];
    if (u === endId) break;
    adj[u].forEach((v) => {
      if (!(v in prev)) {
        prev[v] = u;
        q.push(v);
      }
    });
  }
  if (!(endId in prev)) return null;
  const path = [];
  for (let v = endId; v !== null; v = prev[v]) path.push(v);
  return path.reverse();
}

function pathToLinks(path, links) {
  const pairs = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const link = links.find(
      (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a)
    );
    if (!link) return null;
    pairs.push(link);
  }
  return pairs;
}

// ----------------------------- ANA BİLEŞEN ------------------------------ //

export default function RoutingAcademy() {
  const [gameState, setGameState] = useState("menu"); // menu | playing | paused
  const [level, setLevel] = useState(1);
  const [protocol, setProtocol] = useState("static");
  const [logs, setLogs] = useState([]);
  const [score, setScore] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [time, setTime] = useState(0);
  const [concepts, setConcepts] = useState(new Set());
  const [packetPos, setPacketPos] = useState("dev"); // node id
  const timerRef = useRef(null);

  const topo = useMemo(() => makeTopology(level), [level]);

  useEffect(() => {
    if (simulating) {
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [simulating]);

  function resetAll() {
    setLogs([]);
    setTime(0);
    setPacketPos("dev");
    setSimulating(false);
  }

  function log(msg, type = "info") {
    const icon =
      type === "success"
        ? "✅"
        : type === "error"
        ? "❌"
        : type === "warn"
        ? "⚠️"
        : type === "route"
        ? "🧭"
        : type === "ttl"
        ? "⏳"
        : "ℹ️";
    setLogs((l) => [
      ...l,
      `[${new Date().toLocaleTimeString()}] ${icon} ${msg}`,
    ]);
  }

  async function simulate() {
    if (simulating) return;
    resetAll();
    setSimulating(true);

    const { nodes, links, r1Routes, bgpPaths, DEV_IP, SRV_IP } = topo;

    // Paket oluştur
    const packet = {
      id: Math.random().toString(36).slice(2, 8),
      src: DEV_IP,
      dst: SRV_IP,
      ttl: 64,
      pathNodes: ["dev"],
    };

    log(
      `Paket oluşturuldu: ${packet.id} | Kaynak: ${packet.src} → Hedef: ${packet.dst}`
    );
    await sleep(500);

    // DEV → R1
    await moveAlong(["dev", "r1"], links, packet);

    // ROUTING KARARI (R1'de)
    log(`[Router-1] Paket alındı. TTL: ${packet.ttl}`, "ttl");
    packet.ttl -= 1;
    if (packet.ttl <= 0) return fail("TTL aşıldı. Paket düştü.");

    // En iyi yol seçimi
    const decision = decideRoute({
      protocol,
      nodes,
      links,
      r1Routes,
      bgpPaths,
      dstNodeId: "srv",
    });

    if (!decision || !decision.path) {
      return fail("[Router-1] Uygun yol bulunamadı. Hedef ağa ulaşılamıyor.");
    }

    // Kararı logla
    log(
      `[Router-1] Protokol: ${
        PROTOCOLS[protocol].label
      } | Seçilen yol: ${decision.path.join(" → ")}`,
      "route"
    );
    if (decision.reason) log(`Karar gerekçesi: ${decision.reason}`);

    // Hareket: R1 -> ... -> SRV
    const linksToTraverse = pathToLinks(decision.path, links);
    if (!linksToTraverse) {
      return fail("Seçilen yol linklere çözümlenemedi.");
    }

    for (const link of linksToTraverse) {
      const nextNode = link.a === packet.pathNodes.at(-1) ? link.b : link.a;
      if (link.status !== "up") {
        log(`Link ${link.id} DOWN! Failover aranıyor...`, "warn");
        return fail("Bağlantı koptu, yedek route bulunamadı.");
      }
      await hopTo(nextNode, link.delay, packet);
      packet.ttl -= 1;
      if (packet.ttl <= 0) return fail("TTL aşıldı. Paket düştü.");
    }

    // Başarılı teslim
    log(`[${nodes.srv.name}] Paket başarıyla teslim edildi!`, "success");
    log(`Toplam hop: ${packet.pathNodes.length - 1}`);
    log(`Teslim süresi: ${time}s`);

    const base = LEVELS[level].points;
    const timeBonus = Math.max(0, 12 - time) * 8;
    const protoBonus =
      protocol === "ospf" && level === 2
        ? 50
        : protocol === "static" && level === 1
        ? 20
        : 0;
    const total = base + timeBonus + protoBonus;
    setScore((s) => s + total);
    log(
      `Skor: ${total} (Level: ${base}, Zaman bonusu: ${timeBonus}, Protokol bonusu: ${protoBonus})`,
      "success"
    );

    // Öğrenim
    const learned = new Set(concepts);
    if (protocol === "static")
      ["routing-table", "longest-prefix", "next-hop"].forEach((c) =>
        learned.add(c)
      );
    if (protocol === "rip")
      ["hop-count", "distance-vector"].forEach((c) => learned.add(c));
    if (protocol === "ospf")
      ["link-state", "dijkstra", "cost"].forEach((c) => learned.add(c));
    if (level === 3)
      ["failover", "backup-route"].forEach((c) => learned.add(c));
    setConcepts(learned);

    setSimulating(false);

    function fail(reason) {
      log(reason, "error");
      setSimulating(false);
    }
  }

  function decideRoute({
    protocol,
    nodes,
    links,
    r1Routes,
    bgpPaths,
    dstNodeId,
  }) {
    if (protocol === "static") {
      // Longest Prefix Match
      const pick =
        longestPrefixMatch(r1Routes, topo.SRV_IP) ||
        r1Routes.find((r) => r.prefix === "0.0.0.0/0");
      if (!pick) return null;

      // Interface durumunu linklere bakarak doğrula
      // iface adlarını node id eşlemesi olarak kullanıyoruz (r1->r2, r1->isp, r1->srv)
      const neighbor =
        pick.iface === "srv"
          ? "srv"
          : pick.iface === "r2"
          ? "r2"
          : pick.iface === "isp"
          ? "isp"
          : null;

      if (neighbor) {
        const primaryPath = ["r1", neighbor, "srv"].filter(
          (x, i, arr) => arr.indexOf(x) === i
        );
        const primaryLinks = pathToLinks(primaryPath, links);
        const down = primaryLinks?.some((l) => l.status !== "up");
        if (!down) {
          return {
            path: primaryPath,
            reason: `LPM: ${pick.prefix} → iface ${pick.iface} (metric ${pick.metric})`,
          };
        }
        // Failover: diğer route'ları dene
        const alts = r1Routes
          .filter(
            (r) => r.prefix.startsWith("192.168.2.") && r.iface !== pick.iface
          )
          .sort((a, b) => a.metric - b.metric);
        for (const alt of alts) {
          const nb =
            alt.iface === "srv"
              ? "srv"
              : alt.iface === "r2"
              ? "r2"
              : alt.iface === "isp"
              ? "isp"
              : null;
          if (!nb) continue;
          const p = ["r1", nb, "srv"].filter(
            (x, i, arr) => arr.indexOf(x) === i
          );
          const ok = pathToLinks(p, links)?.every((l) => l.status === "up");
          if (ok) {
            return {
              path: p,
              reason: `Primary down → Failover: ${alt.iface} (metric ${alt.metric})`,
            };
          }
        }
        // Default route
        const def = r1Routes.find((r) => r.prefix === "0.0.0.0/0");
        if (def) {
          const nb =
            def.iface === "srv"
              ? "srv"
              : def.iface === "r2"
              ? "r2"
              : def.iface === "isp"
              ? "isp"
              : null;
          if (nb) {
            const p = ["r1", nb, "srv"].filter(
              (x, i, arr) => arr.indexOf(x) === i
            );
            const ok = pathToLinks(p, links)?.every((l) => l.status === "up");
            if (ok)
              return {
                path: p,
                reason: `Default route kullanıldı (${def.iface})`,
              };
          }
        }
        return null;
      }

      // iface "dev" ise hedefe gitmez, default'a düşer
      const def = r1Routes.find((r) => r.prefix === "0.0.0.0/0");
      if (def) {
        const nb =
          def.iface === "srv"
            ? "srv"
            : def.iface === "r2"
            ? "r2"
            : def.iface === "isp"
            ? "isp"
            : null;
        const p = ["r1", nb, "srv"].filter((x, i, arr) => arr.indexOf(x) === i);
        const ok = pathToLinks(p, links)?.every((l) => l.status === "up");
        if (ok) return { path: p, reason: `Default route (${def.iface})` };
      }
      return null;
    }

    if (protocol === "rip") {
      // Hop sayısı minimum yol
      const path = hopCountPath(nodes, links, "r1", dstNodeId);
      if (!path) return null;
      return { path, reason: `RIP: en az hop (${path.length - 1})` };
    }

    if (protocol === "ospf") {
      // Cost toplamı minimum yol
      const path = dijkstraPath(nodes, links, "r1", dstNodeId);
      if (!path) return null;
      const totalCost = pathToLinks(path, links)?.reduce(
        (s, l) => s + l.cost,
        0
      );
      return { path, reason: `OSPF: toplam cost ${totalCost}` };
    }

    if (protocol === "bgp") {
      // LOCAL_PREF > kısa AS-PATH
      const candidates = bgpPaths
        .filter((p) => {
          const ok = pathToLinks(p.path, links)?.every(
            (l) => l.status === "up"
          );
          return ok;
        })
        .sort((a, b) => {
          if (b.localPref !== a.localPref) return b.localPref - a.localPref;
          return a.asPath.length - b.asPath.length;
        });
      if (!candidates.length) return null;
      const c = candidates[0];
      return {
        path: c.path,
        reason: `BGP: LOCAL_PREF ${c.localPref}, AS_PATH ${c.asPath.length} (${c.note})`,
      };
    }

    return null;
  }

  async function moveAlong(path, links, packet) {
    const ls = pathToLinks(path, links);
    if (!ls) return;
    for (const link of ls) {
      const nextNode = link.a === packet.pathNodes.at(-1) ? link.b : link.a;
      await hopTo(nextNode, link.delay, packet);
    }
  }

  async function hopTo(nextNodeId, delay, packet) {
    const { nodes } = topo;
    const from = packet.pathNodes.at(-1);
    const to = nextNodeId;
    log(`Hop: ${nodes[from].name} → ${nodes[to].name}`);
    setPacketPos(to);
    packet.pathNodes.push(to);
    await sleep(delay);
  }

  // ----------------------------- RENDER ------------------------------ //

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="max-w-5xl w-full px-6">
          <div className="text-center mb-10">
            <Globe className="w-20 h-20 mx-auto mb-4 text-blue-400" />
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Network Routing Academy
            </h1>
            <p className="text-gray-300 mt-3">
              Gerçek bir router gibi düşün, paketi doğru rotayla hedefe ulaştır!
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(LEVELS).map((lv) => (
              <div
                key={lv.id}
                className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-5 flex flex-col"
              >
                <div className="text-sm text-blue-200 font-semibold mb-1">
                  Level {lv.id}
                </div>
                <div className="text-xl font-bold">{lv.title}</div>
                <p className="text-gray-300 text-sm mt-2 flex-1">
                  {lv.description}
                </p>
                <button
                  onClick={() => {
                    setLevel(lv.id);
                    resetAll();
                    setGameState("playing");
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-xl font-semibold"
                >
                  Başlat <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-blue-200">
              <Info className="w-4 h-4" />
              <span className="text-sm">
                Puanınız bu oturumda birikir. Her seviyede daha gelişmiş routing
                kararları öğreneceksiniz.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <Header
        level={level}
        score={score}
        time={time}
        simulating={simulating}
        onPause={() => setGameState("paused")}
        onReset={() => resetAll()}
      />

      <div className="container mx-auto px-4 py-6">
        <LevelInfoCard level={LEVELS[level]} />

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <Topology
              topo={topo}
              packetPos={packetPos}
              simulating={simulating}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ControlPanel
              protocol={protocol}
              setProtocol={setProtocol}
              simulating={simulating}
              onSend={simulate}
              onReset={resetAll}
            />
            <RoutingTable r1Routes={topo.r1Routes} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <LogPanel logs={logs} />
          <LearningPanel
            protocol={protocol}
            concepts={concepts}
            level={level}
          />
        </div>
      </div>
    </div>
  );
}

// ----------------------------- ALT BİLEŞENLER ------------------------------ //

function Header({ level, score, time, simulating, onPause, onReset }) {
  return (
    <div className="bg-white/10 backdrop-blur border-b border-white/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs text-blue-200">Level</div>
            <div className="text-xl font-extrabold">#{level}</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-yellow-400" />
              <span>{score} puan</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-300" />
              <span>{time}s</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPause}
            disabled={!simulating}
            className={`p-2 rounded-lg transition ${
              simulating
                ? "bg-white/20 hover:bg-white/30"
                : "bg-white/10 text-white/50"
            }`}
            title="Durdur (Sadece görsel)"
          >
            <Pause className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
            title="Sıfırla"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LevelInfoCard({ level }) {
  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur rounded-2xl p-6 border border-white/20">
      <div className="flex items-start gap-3">
        <Target className="w-6 h-6 text-blue-300 mt-1" />
        <div>
          <h2 className="text-2xl font-bold mb-2">{level.title}</h2>
          <p className="text-gray-200 mb-3">{level.description}</p>
          <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3">
            <p className="text-amber-100">
              <strong>Senaryo:</strong> {level.scenario}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Topology({ topo, packetPos }) {
  const { nodes, links } = topo;

  // 80x16 grid → tailwind absolute positioning (left %, top %)
  const toStyle = (x, y) => ({
    left: `${x}%`,
    top: `${y}%`,
  });

  const NodeIcon = ({ type, className }) =>
    type === "host" ? (
      <PcCase className={className} />
    ) : (
      <Server className={className} />
    );

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5" /> Network Topology
      </h3>

      <div className="relative w-full aspect-[4/3] rounded-xl bg-slate-800/40 overflow-hidden">
        {/* Links */}
        {links.map((l) => {
          const a = nodes[l.a];
          const b = nodes[l.b];
          if (!a || !b) return null;
          const x1 = a.x;
          const y1 = a.y;
          const x2 = b.x;
          const y2 = b.y;
          const midLeft = (x1 + x2) / 2;
          const midTop = (y1 + y2) / 2;
          return (
            <div key={l.id}>
              <div
                className={`absolute h-1 rounded-full ${
                  l.status === "up"
                    ? "bg-gradient-to-r from-blue-500 to-green-500"
                    : "bg-red-500/70"
                }`}
                style={{
                  left: `${Math.min(x1, x2)}%`,
                  top: `${Math.min(y1, y2)}%`,
                  width: `${Math.hypot(x2 - x1, y2 - y1)}%`,
                  transformOrigin: "0 0",
                  transform: `rotate(${
                    (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
                  }deg)`,
                }}
              />
              <div
                className={`absolute text-[8px] sm:text-[10px] md:text-xs px-1 py-0.5 rounded ${
                  l.status === "up"
                    ? "bg-black/60 text-white/80"
                    : "bg-red-600/80 text-white"
                }`}
                style={toStyle(midLeft, midTop)}
              >
                cost:{l.cost}
              </div>
            </div>
          );
        })}

        {/* Nodes */}
        {Object.values(nodes).map((n) => (
          <div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={toStyle(n.x, n.y)}
          >
            <div className="relative">
              <NodeIcon
                type={n.type}
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-1 ${
                  n.type === "host" ? "text-blue-300" : "text-gray-200"
                }`}
              />
              {/* Warning on any down link connected */}
              {links.some(
                (l) => (l.a === n.id || l.b === n.id) && l.status === "down"
              ) && (
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 absolute -top-1 -right-1" />
              )}
            </div>
            <div className="text-xs sm:text-sm font-semibold">{n.name}</div>
            <div className="text-[10px] sm:text-xs text-gray-400">{n.ip}</div>
          </div>
        ))}

        {/* Packet */}
        {nodes[packetPos] && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out"
            style={toStyle(nodes[packetPos].x, nodes[packetPos].y - 6)}
          >
            <div className="relative">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-300 animate-bounce" />
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-2 left-2 text-[10px] sm:text-xs space-y-1 bg-black/40 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-1 rounded bg-gradient-to-r from-blue-500 to-green-500" />
            <span>Aktif bağlantı</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-1 rounded bg-red-500/70" />
            <span>Kopuk bağlantı</span>
          </div>
          <div className="text-[9px] sm:text-[10px] text-white/70">
            cost = OSPF ağırlığı, aynı zamanda gecikmeyi etkiler.
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlPanel({ protocol, setProtocol, simulating, onSend, onReset }) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" /> Kontrol Paneli
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Routing Protokolü
          </label>
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(PROTOCOLS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {PROTOCOLS[protocol].explain}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSend}
            disabled={simulating}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
              simulating
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Play className="w-4 h-4" />
            Send Packet
          </button>

          <button
            onClick={onReset}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function RoutingTable({ r1Routes }) {
  if (!r1Routes?.length) return null;
  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-3">
        Router-1 Routing Table (Static)
      </h3>
      <div className="text-xs text-gray-300 mb-3">
        Eğitim amaçlı örnek tablo: longest prefix + metric. Failover için
        alternatif girişler bulunur.
      </div>
      <div className="rounded-lg overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="text-left p-2">Prefix</th>
              <th className="text-left p-2">Iface</th>
              <th className="text-left p-2">Next Hop</th>
              <th className="text-left p-2">Metric</th>
              <th className="text-left p-2">Not</th>{" "}
            </tr>
          </thead>
          <tbody>
            {r1Routes.map((r, i) => (
              <tr key={i} className="odd:bg-white/5">
                <td className="p-2">{r.prefix}</td>
                <td className="p-2">{r.iface}</td>
                <td className="p-2">{r.nextHop}</td>
                <td className="p-2">{r.metric}</td>
                <td className="p-2">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogPanel({ logs }) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-3">Olay Günlüğü</h3>
      <div className="h-[220px] overflow-auto bg-black/30 rounded-lg p-3 text-sm space-y-1">
        {logs.length === 0 ? (
          <div className="text-white/50">
            Log yok. "Send Packet" ile simülasyonu başlatın.
          </div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="font-mono text-white/90">
              {l}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LearningPanel({ protocol, concepts, level }) {
  const list = Array.from(concepts);
  const hints = {
    1: [
      "Router gelen paketin TTL değerini düşürür.",
      "Longest Prefix Match: /24, /16, /0... En spesifik prefix kazanır.",
      "Default route (0.0.0.0/0) tüm hedefler için çıkış kapısıdır.",
    ],
    2: [
      "RIP: En az hop her zaman en hızlı değildir, ama basittir.",
      "OSPF: Link state topolojisini bilir, Dijkstra ile en düşük maliyetli yol.",
      "Metric ≠ Cost: Metric tablo girdisi, cost link ağırlığı olabilir.",
    ],
    3: [
      "Failover: Birincil link down olduğunda yedek yollar devreye girer.",
      "Monitoring önemlidir: interface ve komşu durumları takip edilmelidir.",
      "BGP: LOCAL_PREF > AS_PATH (basitleştirilmiş kural).",
    ],
  }[level];

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> Öğrenme Paneli
      </h3>
      <div className="text-xs text-blue-200 mb-4">
        Seçili protokol:{" "}
        <span className="font-semibold">{PROTOCOLS[protocol].label}</span>
      </div>

      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">İpuçları</div>
        <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
          {hints.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Öğrenilen Kavramlar</div>
        {list.length === 0 ? (
          <div className="text-sm text-white/60">
            Henüz kavram işaretlenmedi. Simülasyonu tamamlayın.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {list.map((c) => (
              <span
                key={c}
                className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 px-2 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
