// Dosya Yolu: src/pages/AlgorithmsPage.jsx

import React, { useState, useEffect } from "react";
import Section from "../components/organisms/Section";
import Card from "../components/molecules/Card";
import CodeBlock from "../components/molecules/CodeBlock";
import { Route, Zap, BrainCircuit, Play, RotateCcw, Check } from "lucide-react";

// --- Simülasyon Verileri ---

// Tüm simülasyonlar için kullanılacak sabit ağ topolojisi
const networkData = {
  nodes: [
    { id: "A", x: "10%", y: "50%" },
    { id: "B", x: "35%", y: "20%" },
    { id: "C", x: "35%", y: "80%" },
    { id: "D", x: "65%", y: "20%" },
    { id: "E", x: "65%", y: "80%" },
    { id: "F", x: "90%", y: "50%" },
  ],
  edges: [
    { from: "A", to: "B", weight: 2 },
    { from: "A", to: "C", weight: 4 },
    { from: "B", to: "D", weight: 3 },
    { from: "C", to: "E", weight: 2 },
    { from: "D", to: "E", weight: 1 },
    { from: "D", to: "F", weight: 5 },
    { from: "E", to: "F", weight: 2 },
  ],
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// --- Algoritma Simülatörü Bileşeni ---

const AlgorithmSimulator = ({ algorithmType }) => {
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationState, setSimulationState] = useState({}); // Algoritmaya özel verileri tutar

  const resetSimulation = () => {
    setIsSimulating(false);
    setLogs([]);
    setSimulationState({});
  };

  useEffect(resetSimulation, [algorithmType]); // Tab değiştiğinde simülasyonu sıfırla

  const runDistanceVector = async () => {
    setIsSimulating(true);
    let newLogs = ["Distance Vector (Bellman-Ford) simülasyonu başlatıldı."];
    setLogs([...newLogs]);

    // 1. Başlangıç tablolarını oluştur
    let tables = {};
    networkData.nodes.forEach((node) => {
      tables[node.id] = {};
      networkData.nodes.forEach((dest) => {
        tables[node.id][dest.id] = { cost: Infinity, nextHop: null };
      });
      tables[node.id][node.id] = { cost: 0, nextHop: node.id };
    });

    networkData.edges.forEach(({ from, to, weight }) => {
      tables[from][to] = { cost: weight, nextHop: to };
      tables[to][from] = { cost: weight, nextHop: from };
    });

    setSimulationState({ tables, round: 0, highlightedNode: null });
    newLogs.push("ROUND 0: Her router sadece doğrudan komşularını tanıyor.");
    setLogs([...newLogs]);
    await delay(2000);

    // 2. Raundlar halinde güncelle
    for (let i = 1; i < networkData.nodes.length; i++) {
      let changed = false;
      newLogs.push(
        `--- ROUND ${i}: Router'lar tablolarını komşularıyla paylaşıyor... ---`
      );
      setLogs([...newLogs]);
      setSimulationState((s) => ({ ...s, round: i }));
      await delay(1000);

      for (const node of networkData.nodes) {
        setSimulationState((s) => ({ ...s, highlightedNode: node.id }));
        newLogs.push(`> Router ${node.id} komşularını dinliyor...`);
        setLogs([...newLogs]);
        await delay(1500);

        const neighbors = networkData.edges.filter(
          (e) => e.from === node.id || e.to === node.id
        );
        for (const edge of neighbors) {
          const neighborId = edge.from === node.id ? edge.to : edge.from;
          // Bellman-Ford temel mantığı
          for (const destId in tables[neighborId]) {
            const newCost =
              tables[node.id][neighborId].cost +
              tables[neighborId][destId].cost;
            if (newCost < tables[node.id][destId].cost) {
              tables[node.id][destId] = { cost: newCost, nextHop: neighborId };
              changed = true;
            }
          }
        }
      }
      if (!changed) {
        newLogs.push(
          "Tüm tablolar stabil hale geldi. Yakınsama (Convergence) tamamlandı!"
        );
        setLogs([...newLogs]);
        break;
      }
    }
    setSimulationState((s) => ({ ...s, highlightedNode: null }));
    setIsSimulating(false);
  };

  const runLinkState = async () => {
    setIsSimulating(true);
    let newLogs = ["Link State (Dijkstra) simülasyonu başlatıldı. Kaynak: A"];
    setLogs([...newLogs]);

    // 1. Dijkstra başlangıç durumu
    let distances = {};
    let prev = {};
    let unvisited = new Set(networkData.nodes.map((n) => n.id));
    networkData.nodes.forEach((n) => (distances[n.id] = Infinity));
    distances["A"] = 0;

    setSimulationState({
      distances,
      prev,
      visited: [],
      current: null,
      path: {},
    });
    await delay(1500);

    while (unvisited.size > 0) {
      // En düşük mesafeli, ziyaret edilmemiş düğümü bul
      const current = [...unvisited].reduce((min, node) =>
        distances[node] < distances[min] ? node : min
      );
      unvisited.delete(current);

      newLogs.push(
        `> En kısa yol adayı: ${current} (Mesafe: ${distances[current]})`
      );
      setLogs([...newLogs]);
      setSimulationState((s) => ({
        ...s,
        current,
        visited: [...s.visited, current],
      }));
      await delay(2000);

      // Komşularını gez
      const neighbors = networkData.edges.filter(
        (e) => e.from === current || e.to === current
      );
      for (const edge of neighbors) {
        const neighborId = edge.from === current ? edge.to : edge.from;
        if (![...unvisited].includes(neighborId)) continue;

        const newDist = distances[current] + edge.weight;
        newLogs.push(
          `  - Komşu ${neighborId} kontrol ediliyor. Yeni mesafe: ${newDist}`
        );
        setLogs([...newLogs]);

        if (newDist < distances[neighborId]) {
          distances[neighborId] = newDist;
          prev[neighborId] = current;
          newLogs.push(
            `    -> Daha iyi bir yol bulundu! ${neighborId} mesafesi güncellendi.`
          );
          setLogs([...newLogs]);
        }
        await delay(1500);
      }
    }

    // En kısa yolu F için oluştur
    let path = [];
    let current = "F";
    while (current) {
      path.unshift(current);
      current = prev[current];
    }

    newLogs.push(
      `✅ SONUÇ: A'dan F'ye en kısa yol bulundu: ${path.join(
        " -> "
      )} (Toplam Maliyet: ${distances["F"]})`
    );
    setLogs([...newLogs]);
    setSimulationState((s) => ({
      ...s,
      current: null,
      path: { nodes: path, cost: distances["F"] },
    }));
    setIsSimulating(false);
  };

  const isLinkState = algorithmType === "linkState";

  return (
    <Card>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Görsel Ağ Topolojisi */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[300px] relative">
          {networkData.edges.map(({ from, to, weight }, i) => {
            const nodeFrom = networkData.nodes.find((n) => n.id === from);
            const nodeTo = networkData.nodes.find((n) => n.id === to);
            const isPath =
              simulationState.path?.nodes?.includes(from) &&
              simulationState.path?.nodes?.includes(to);
            return (
              <React.Fragment key={i}>
                <svg className="absolute top-0 left-0 w-full h-full overflow-visible">
                  <line
                    x1={nodeFrom.x}
                    y1={nodeFrom.y}
                    x2={nodeTo.x}
                    y2={nodeTo.y}
                    className={`stroke-2 transition-all duration-500 ${
                      isPath ? "stroke-cyan-400" : "stroke-gray-600"
                    }`}
                  />
                </svg>
                <div
                  className="absolute text-xs text-yellow-300"
                  style={{
                    top: `calc((${nodeFrom.y} + ${nodeTo.y}) / 2)`,
                    left: `calc((${nodeFrom.x} + ${nodeTo.x}) / 2)`,
                  }}
                >
                  {weight}
                </div>
              </React.Fragment>
            );
          })}
          {networkData.nodes.map(({ id, x, y }) => {
            const isVisited =
              isLinkState && simulationState.visited?.includes(id);
            const isCurrent = isLinkState && simulationState.current === id;
            const isDVCurrent =
              !isLinkState && simulationState.highlightedNode === id;
            return (
              <div
                key={id}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: x, top: y }}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-300
                            ${
                              isCurrent
                                ? "bg-cyan-500 border-cyan-300 scale-125"
                                : isVisited
                                ? "bg-purple-600 border-purple-400"
                                : isDVCurrent
                                ? "bg-yellow-500 border-yellow-300 scale-125"
                                : "bg-gray-700 border-gray-500"
                            }`}
                >
                  {id}
                </div>
                {isLinkState &&
                  simulationState.distances &&
                  simulationState.distances[id] !== undefined && (
                    <span className="text-xs absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/50 px-1 rounded">
                      {simulationState.distances[id] === Infinity
                        ? "∞"
                        : simulationState.distances[id]}
                    </span>
                  )}
              </div>
            );
          })}
        </div>

        {/* Kontrol ve Log Paneli */}
        <div>
          <button
            onClick={isLinkState ? runLinkState : runDistanceVector}
            disabled={isSimulating}
            className="w-full bg-cyan-500 text-slate-900 font-bold py-3 rounded-lg flex items-center justify-center hover:bg-cyan-400 transition-colors disabled:bg-gray-600"
          >
            <Play className="w-5 h-5 mr-2" />{" "}
            {isSimulating ? "Çalışıyor..." : "Simülasyonu Başlat"}
          </button>
          <CodeBlock title="Algoritma Adımları">
            {logs.length > 0
              ? logs.map((log, i) => (
                  <p
                    key={i}
                    className={`whitespace-pre-wrap ${
                      log.includes("SONUÇ") ? "text-green-400 font-bold" : ""
                    }`}
                  >
                    {log}
                  </p>
                ))
              : "Başlamak için butona basın."}
          </CodeBlock>
        </div>
      </div>
    </Card>
  );
};

// --- Ana Sayfa Bileşeni ---

const AlgorithmsPage = () => {
  const [activeTab, setActiveTab] = useState("distanceVector");

  return (
    <Section title="Routing Algoritmaları Laboratuvarı">
      <p className="text-center max-w-3xl mx-auto mb-8">
        Router'ların beyni olan algoritmaların dünyasına dalın. Farklı "düşünme"
        yöntemlerinin, aynı ağ üzerinde en iyi yolu nasıl bulduğunu
        karşılaştırın.
      </p>

      {/* Tab Butonları */}
      <div className="flex justify-center space-x-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl shadow-sm w-fit mx-auto mb-8">
        <button
          onClick={() => setActiveTab("distanceVector")}
          className={`px-6 py-2 rounded-lg font-medium transition-colors text-sm ${
            activeTab === "distanceVector"
              ? "bg-cyan-500 text-slate-900"
              : "text-gray-200 hover:bg-white/10"
          }`}
        >
          Distance Vector (Komşudan Öğrenme)
        </button>
        <button
          onClick={() => setActiveTab("linkState")}
          className={`px-6 py-2 rounded-lg font-medium transition-colors text-sm ${
            activeTab === "linkState"
              ? "bg-cyan-500 text-slate-900"
              : "text-gray-200 hover:bg-white/10"
          }`}
        >
          Link State (Haritayı Çıkarma)
        </button>
      </div>

      {/* Tab İçerikleri */}
      {activeTab === "distanceVector" && (
        <Card title="Distance Vector Simülasyonu (RIP gibi)">
          <p className="mb-4">
            Bu algoritmada, her router sadece doğrudan bağlı komşularını tanır
            ve onlardan aldığı bilgilere güvenir. "Dedikodu" yoluyla tüm ağı
            öğrenmeye çalışır. Simülasyonu başlatın ve router tablolarının her
            raundda nasıl güncellendiğini izleyin.
          </p>
          <AlgorithmSimulator algorithmType="distanceVector" />
        </Card>
      )}
      {activeTab === "linkState" && (
        <Card title="Link State Simülasyonu (OSPF gibi)">
          <p className="mb-4">
            Bu gelişmiş algoritmada, her router tüm ağın tam bir haritasını
            oluşturur ve en kısa yolu kendisi hesaplar (Dijkstra algoritması
            ile). Simülasyonu başlatarak algoritmanın 'A' noktasından tüm ağa
            giden en kısa yolları nasıl keşfettiğini görün.
          </p>
          <AlgorithmSimulator algorithmType="linkState" />
        </Card>
      )}
    </Section>
  );
};

export default AlgorithmsPage;
