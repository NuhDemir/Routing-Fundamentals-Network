// Dosya Yolu: src/pages/TablesPage.jsx

import React, { useState } from "react";
import Section from "../components/organisms/Section";
import Card from "../components/molecules/Card";
import CodeBlock from "../components/molecules/CodeBlock";
import { FileText, Search, Route, Check, Server, Globe } from "lucide-react";

// Simülasyon için örnek routing tablosu verisi
const routingTableData = [
  {
    network: "192.168.1.128/25",
    nextHop: "10.0.1.1",
    interface: "FastEthernet0/1",
    type: "OSPF",
    metric: 110,
  },
  {
    network: "192.168.1.0/24",
    nextHop: "10.0.2.1",
    interface: "GigabitEthernet0/0",
    type: "Static",
    metric: 1,
  },
  {
    network: "192.168.0.0/16",
    nextHop: "10.0.3.1",
    interface: "Serial0/0/0",
    type: "EIGRP",
    metric: 90,
  },
  {
    network: "0.0.0.0/0",
    nextHop: "203.0.113.1",
    interface: "GigabitEthernet0/1",
    type: "Static",
    metric: 5,
  }, // Default Route
];

// IP adresi ve CIDR'dan bitwise kontrolü yapan yardımcı fonksiyon
const isIpInSubnet = (ip, cidr) => {
  try {
    const [network, bits] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);

    const ipToLong = (ip) =>
      ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);

    const ipLong = ipToLong(ip);
    const networkLong = ipToLong(network);

    return (ipLong & mask) === (networkLong & mask);
  } catch (e) {
    return false;
  }
};

const TablesPage = () => {
  const [destinationIp, setDestinationIp] = useState("192.168.1.150");
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [bestMatchRow, setBestMatchRow] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const handleFindRoute = async () => {
    setIsSimulating(true);
    setSimulationLogs([]);
    setHighlightedRow(null);
    setBestMatchRow(null);
    await delay(200);

    const logs = [`[Başlangıç] Paket alındı. Hedef: ${destinationIp}`];
    setSimulationLogs([...logs]);
    await delay(1000);

    let bestMatch = null;

    for (let i = 0; i < routingTableData.length; i++) {
      const route = routingTableData[i];
      setHighlightedRow(i);
      logs.push(`[İnceleme] Satır ${i + 1} kontrol ediliyor: ${route.network}`);
      setSimulationLogs([...logs]);
      await delay(1500);

      if (isIpInSubnet(destinationIp, route.network)) {
        const prefix = parseInt(route.network.split("/")[1], 10);
        logs.push(`  -> EŞLEŞME BULUNDU! (Önek: /${prefix})`);
        setSimulationLogs([...logs]);
        await delay(1000);

        if (!bestMatch || prefix > bestMatch.prefix) {
          bestMatch = { ...route, index: i, prefix };
          logs.push(`  -> BU YENİ EN İYİ ADAY! (Daha spesifik bir yol)`);
          setSimulationLogs([...logs]);
          setBestMatchRow(i);
          await delay(1000);
        } else {
          logs.push(
            `  -> Ancak mevcut en iyi aday (/${bestMatch.prefix}) daha spesifik. Aday değişmedi.`
          );
          setSimulationLogs([...logs]);
          await delay(1000);
        }
      } else {
        logs.push("  -> Eşleşme yok.");
        setSimulationLogs([...logs]);
      }
      await delay(500);
    }

    setHighlightedRow(null);

    if (bestMatch) {
      logs.push(
        `[SONUÇ] Tarama tamamlandı. En Uzun Önek Eşleşmesi kuralına göre en iyi yol ${bestMatch.network} olarak belirlendi.`
      );
    } else {
      logs.push(
        "[SONUÇ] Spesifik bir yol bulunamadı. Paket, varsa 'Default Route' kullanılarak gönderilecek."
      );
      const defaultRouteIndex = routingTableData.findIndex(
        (r) => r.network === "0.0.0.0/0"
      );
      if (defaultRouteIndex !== -1) {
        setBestMatchRow(defaultRouteIndex);
        logs.push(
          `[Yönlendirme] Paket, ${routingTableData[defaultRouteIndex].nextHop} adresine gönderiliyor.`
        );
      }
    }
    setSimulationLogs([...logs]);
    setIsSimulating(false);
  };

  return (
    <Section title="Routing Tablosu Laboratuvarı">
      <p className="text-center max-w-3xl mx-auto mb-8">
        Bir router'ın beynine yolculuk yapın. Bir hedef IP adresi girin ve
        router'ın bu hedefe ulaşmak için routing tablosundaki en iyi yolu "En
        Uzun Önek Eşleşmesi" kuralına göre nasıl seçtiğini adım adım izleyin.
      </p>

      <Card>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Kontrol ve Log Paneli */}
          <div>
            <h3 className="text-xl font-bold mb-4">Simülasyon Kontrolü</h3>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={destinationIp}
                onChange={(e) => setDestinationIp(e.target.value)}
                placeholder="Hedef IP Adresi Girin"
                className="flex-grow p-2 rounded border bg-gray-50"
              />
              <button
                onClick={handleFindRoute}
                disabled={isSimulating}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSimulating ? "Aranıyor..." : "Yolu Bul"}
              </button>
            </div>
            <CodeBlock title="Router'ın Düşünce Süreci">
              {simulationLogs.length > 0
                ? simulationLogs.map((log, index) => (
                    <p
                      key={index}
                      className={`whitespace-pre-wrap ${
                        log.includes("EN İYİ ADAY") ? "text-green-400" : ""
                      } ${log.includes("SONUÇ") ? "font-bold" : ""}`}
                    >
                      {log}
                    </p>
                  ))
                : 'Bir hedef IP adresi girip "Yolu Bul" butonuna basın.'}
            </CodeBlock>
          </div>
          {/* Routing Tablosu Gösterimi */}
          <div className="overflow-x-auto">
            <h3 className="text-xl font-bold mb-4">Router-1 Routing Tablosu</h3>
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-3">Ağ Adresi (Prefix)</th>
                  <th className="p-3">Sonraki Hop (Next-Hop)</th>
                  <th className="p-3">Arayüz (Interface)</th>
                </tr>
              </thead>
              <tbody>
                {routingTableData.map((route, index) => (
                  <tr
                    key={index}
                    className={`border-b transition-all duration-300
                                ${highlightedRow === index ? "bg-blue-100" : ""}
                                ${
                                  bestMatchRow === index
                                    ? "bg-green-200 ring-2 ring-green-500"
                                    : ""
                                }
                            `}
                  >
                    <td className="p-3 font-mono">{route.network}</td>
                    <td className="p-3">{route.nextHop}</td>
                    <td className="p-3">{route.interface}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-2 text-xs text-gray-600">
              <p>
                <strong className="text-blue-600">Mavi Vurgu:</strong> Router'ın
                o an incelediği satır.
              </p>
              <p>
                <strong className="text-green-600">Yeşil Vurgu:</strong>{" "}
                Router'ın tüm tabloyu taradıktan sonra seçtiği en iyi yol.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
};

export default TablesPage;
