// Dosya Yolu: src/pages/PracticePage.jsx

import React, { useState, useRef, useEffect } from "react";
import Section from "../components/organisms/Section";
import Card from "../components/molecules/Card";
import CodeBlock from "../components/molecules/CodeBlock";
import {
  HardHat,
  CheckCircle,
  XCircle,
  ChevronRight,
  Terminal,
} from "lucide-react";

// --- Senaryo Veritabanı ---
const scenarios = [
  {
    id: 1,
    title: "Senaryo 1: Ulaşılamayan Sunucu",
    difficulty: "Kolay",
    problem:
      "Satış departmanındaki PC-A (192.168.1.10), Finans sunucusuna (192.168.2.50) ulaşamıyor. Bağlantıyı sağlayın.",
    topology: `
  (PC-A) --- [Router-1] --- ??? --- (Finans Sunucusu)
192.168.1.10   192.168.1.1           192.168.2.50
    `,
    initialState: {
      routingTable: [
        {
          network: "192.168.1.0/24",
          nextHop: "Doğrudan Bağlı",
          interface: "Gi0/0",
        },
        // 192.168.2.0/24 ağına giden yol eksik!
      ],
    },
    solution: {
      command: "ip route 192.168.2.0 255.255.255.0 10.10.10.2",
      check: (state) =>
        state.routingTable.some((r) => r.network === "192.168.2.0/24"),
    },
    hint: "`show ip route` komutu ile mevcut routing tablosunu kontrol et. Eksik olan ağı fark edeceksin. Eksik yolu `ip route [ağ] [maske] [sonraki_hop]` komutuyla eklemelisin.",
  },
  {
    id: 2,
    title: "Senaryo 2: Verimsiz İnternet Yolu",
    difficulty: "Orta",
    problem:
      "Tüm şirket trafiği, yavaş ve pahalı olan yedek uydu hattı (Metric: 100) üzerinden internete çıkıyor. Trafiği ana fiber hatta (Metric: 10) yönlendirin.",
    topology: `
           /-- (Fiber Hat - 10.0.0.1) --- [İNTERNET]
 [Şirket Ağı] --- [Router-1]
           \-- (Uydu Hattı - 20.0.0.1) --- [İNTERNET]
    `,
    initialState: {
      routingTable: [
        {
          network: "0.0.0.0/0",
          nextHop: "20.0.0.1",
          interface: "Serial0/1",
          metric: 100,
        }, // Yanlış default route
        {
          network: "10.0.0.0/30",
          nextHop: "Doğrudan Bağlı",
          interface: "Gi0/1",
        },
      ],
    },
    solution: {
      command: "ip route 0.0.0.0 0.0.0.0 10.0.0.1",
      check: (state) =>
        state.routingTable.some(
          (r) => r.network === "0.0.0.0/0" && r.nextHop === "10.0.0.1"
        ),
    },
    hint: "Default route'u (`0.0.0.0/0`) kontrol et. Şu anki next-hop adresi yanlış. Yeni ve daha iyi metrikli bir default route ekleyerek eskisini geçersiz kılmalısın.",
  },
  {
    id: 3,
    title: "Senaryo 3: Hatalı Protokol Yapılandırması",
    difficulty: "Zor",
    problem:
      "Yeni kurulan Router-2, OSPF komşuluğu kuramıyor ve ağ haritasını öğrenemiyor. Router-1 OSPF Area 0'da çalışıyor. Sorunu teşhis edip düzeltin.",
    topology: `
  [Router-1] <--- OSPF ---> [Router-2] ???
   Area 0                     Area 1 (Hatalı)
    `,
    initialState: {
      config: { ospf_area: 1 }, // Router-2'nin yapılandırması
    },
    solution: {
      command: "router ospf 1 area 0",
      check: (state) => state.config.ospf_area === 0,
    },
    hint: "`show running-config` komutuyla OSPF yapılandırmasını kontrol et. OSPF komşuluğu için 'Area' numaralarının eşleşmesi gerekir.",
  },
];

const PracticePage = () => {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [cliOutput, setCliOutput] = useState([
    "Router-1 CLI. Sorunu çözmek için komutları girin. Yardım için `help` yazın.",
  ]);
  const [cliInput, setCliInput] = useState("");
  const [networkState, setNetworkState] = useState(scenarios[0].initialState);
  const [isSolved, setIsSolved] = useState(false);

  const cliEndRef = useRef(null);
  useEffect(() => {
    cliEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cliOutput]);

  useEffect(() => {
    // Senaryo değiştiğinde durumu sıfırla
    setNetworkState(scenarios[activeScenarioIndex].initialState);
    setCliOutput([
      `Senaryo ${activeScenarioIndex + 1} yüklendi. Komutları girin.`,
    ]);
    setIsSolved(false);
    setCliInput("");
  }, [activeScenarioIndex]);

  const handleCliCommand = (e) => {
    e.preventDefault();
    const command = cliInput.trim().toLowerCase();
    const newOutput = [...cliOutput, `Router-1> ${cliInput}`];

    if (command === "help") {
      newOutput.push(
        "Mevcut Komutlar: \n- show ip route\n- show running-config\n- ip route [network] [mask] [nexthop]\n- router ospf 1 area [number]"
      );
    } else if (command === "show ip route") {
      newOutput.push("IP Route Tablosu:");
      if (networkState.routingTable) {
        networkState.routingTable.forEach((r) =>
          newOutput.push(`  S  ${r.network} via ${r.nextHop}`)
        );
      } else {
        newOutput.push("  (Bu senaryoda uygulanamaz)");
      }
    } else if (command === "show running-config") {
      if (networkState.config) {
        newOutput.push("Router Yapılandırması:");
        newOutput.push(`  router ospf 1`);
        newOutput.push(`    area ${networkState.config.ospf_area}`);
      } else {
        newOutput.push("  (Bu senaryoda uygulanamaz)");
      }
    } else if (command === scenarios[activeScenarioIndex].solution.command) {
      newOutput.push("...Komut kabul edildi. Yapılandırma güncellendi...");
      // Çözüm komutu girildiğinde network state'i güncelle
      const updatedState = JSON.parse(JSON.stringify(networkState)); // Deep copy
      if (scenarios[activeScenarioIndex].id === 1)
        updatedState.routingTable.push({
          network: "192.168.2.0/24",
          nextHop: "10.10.10.2",
        });
      if (scenarios[activeScenarioIndex].id === 2)
        updatedState.routingTable[0].nextHop = "10.0.0.1";
      if (scenarios[activeScenarioIndex].id === 3)
        updatedState.config.ospf_area = 0;
      setNetworkState(updatedState);
      setIsSolved(true);
      newOutput.push("✅ BAŞARILI! Sorun çözüldü.");
    } else if (
      command.startsWith("ip route") ||
      command.startsWith("router ospf")
    ) {
      newOutput.push(
        "❌ HATA: Komut sözdizimi doğru olabilir ancak bu senaryodaki sorunu çözmüyor. Tekrar deneyin."
      );
    } else {
      newOutput.push(`% Bilinmeyen komut: "${command}"`);
    }

    setCliOutput(newOutput);
    setCliInput("");
  };

  return (
    <Section title="Pratik Uygulama Laboratuvarı">
      <p className="text-center max-w-3xl mx-auto mb-8">
        Sıra sende! Bir ağ mühendisi olarak karşına çıkan sorunları, sanal komut
        satırını kullanarak çöz. Her senaryo, öğrendiğin bir konuyu
        pekiştirecek.
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Senaryo Açıklaması */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">
              {scenarios[activeScenarioIndex].title}
            </h3>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                scenarios[activeScenarioIndex].difficulty === "Kolay"
                  ? "bg-green-100 text-green-800"
                  : scenarios[activeScenarioIndex].difficulty === "Orta"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {scenarios[activeScenarioIndex].difficulty}
            </span>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-blue-800">Sorun Raporu:</p>
            <p className="text-blue-700">
              {scenarios[activeScenarioIndex].problem}
            </p>
          </div>
          <CodeBlock title="Ağ Topolojisi">
            {scenarios[activeScenarioIndex].topology}
          </CodeBlock>
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
            <strong>İpucu:</strong> {scenarios[activeScenarioIndex].hint}
          </div>
        </Card>

        {/* CLI Terminali */}
        <Card>
          <div className="bg-black rounded-lg p-4 h-[450px] flex flex-col">
            <div className="flex-grow overflow-y-auto font-mono text-sm text-green-400 space-y-1">
              {cliOutput.map((line, i) => (
                <p
                  key={i}
                  className={`whitespace-pre-wrap ${
                    line.includes("✅")
                      ? "text-lime-300"
                      : line.includes("❌")
                      ? "text-red-400"
                      : ""
                  }`}
                >
                  {line}
                </p>
              ))}
              <div ref={cliEndRef} />
            </div>
            <form
              onSubmit={handleCliCommand}
              className="flex items-center mt-4"
            >
              <span className="text-green-400 font-mono">Router-1&gt;</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                className="flex-grow bg-transparent text-green-400 font-mono ml-2 focus:outline-none"
                autoFocus
              />
            </form>
          </div>
          {isSolved && (
            <button
              onClick={() =>
                setActiveScenarioIndex((i) => (i + 1) % scenarios.length)
              }
              className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              Harika! Sonraki Senaryoya Geç{" "}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </Card>
      </div>
    </Section>
  );
};

export default PracticePage;
