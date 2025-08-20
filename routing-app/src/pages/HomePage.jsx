// Dosya Yolu: src/pages/HomePage.jsx

import React, { useState } from "react";
import Section from "../components/organisms/Section";
import Card from "../components/molecules/Card";
import CodeBlock from "../components/molecules/CodeBlock";
import { PcCase, Server, ArrowRight, Mail } from "lucide-react";

// Simülasyon için bekleme fonksiyonu
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const HomePage = () => {
  // Simülasyonun durumunu tutacak state'ler
  const [packetPosition, setPacketPosition] = useState("start"); // 'start', 'router1', 'router2', 'end'
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSendPacket = async () => {
    setIsSimulating(true);
    setLogs([]);
    setPacketPosition("start");
    await delay(500);

    // Adım 1: Paket PC-A'dan Router-1'e gidiyor
    setLogs((prev) => [
      ...prev,
      "[10:00:01] Paket, PC-A (192.168.1.10) tarafından oluşturuldu ve Router-1'e (Gateway) gönderildi.",
    ]);
    setPacketPosition("router1");
    await delay(2000);

    // Adım 2: Router-1 karar veriyor
    setLogs((prev) => [
      ...prev,
      "[10:00:03] Router-1 paketi aldı. Hedef: 192.168.2.20",
    ]);
    await delay(1500);
    setLogs((prev) => [
      ...prev,
      "[10:00:04] Routing tablosu kontrol ediliyor... 192.168.2.0/24 ağına giden en iyi yol 10.0.0.2 (Router-2) üzerinden.",
    ]);
    await delay(2000);
    setLogs((prev) => [
      ...prev,
      "[10:00:06] Paket, Router-2'ye doğru yola çıktı.",
    ]);
    setPacketPosition("router2");
    await delay(2000);

    // Adım 3: Router-2 karar veriyor
    setLogs((prev) => [
      ...prev,
      "[10:00:08] Router-2 paketi aldı. Hedef: 192.168.2.20",
    ]);
    await delay(1500);
    setLogs((prev) => [
      ...prev,
      "[10:00:09] Routing tablosu kontrol ediliyor... Hedef (192.168.2.20), doğrudan bağlı olan 192.168.2.0/24 ağında.",
    ]);
    await delay(2000);
    setLogs((prev) => [...prev, "[10:00:11] Paket, Server-B'ye iletiliyor."]);
    setPacketPosition("end");
    await delay(1500);

    // Adım 4: Paket hedefe ulaşıyor
    setLogs((prev) => [
      ...prev,
      "[10:00:12] BAŞARILI: Paket, Server-B (192.168.2.20) hedefine ulaştı!",
    ]);
    setIsSimulating(false);
  };

  return (
    <div>
      {/* Hero Alanı */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Network Routing Masterclass
        </h1>
        <p className="text-xl opacity-90">
          Ağ yönlendirmesinin tüm inceliklerini öğrenin!
        </p>
      </section>

      {/* "Routing Nedir?" içeriği */}
      <Section title="Routing Nedir?">
        <div className="grid md:grid-cols-2 gap-8">
          <Card title="Gündelik Hayattan Bir Örnek">
            <p className="mb-4">
              Routing'i, bilmediğiniz bir adrese arabayla giderken kullandığınız{" "}
              <strong>GPS (Navigasyon)</strong> gibi düşünebilirsiniz.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Hedef Adres:</strong> Varmak istediğiniz konum. (Paketin
                IP adresi)
              </li>
              <li>
                <strong>Siz (Araba):</strong> Veri paketi.
              </li>
              <li>
                <strong>Kavşaklar:</strong> Router'lar.
              </li>
              <li>
                <strong>GPS'in Kararı:</strong> Router'ın routing tablosuna
                bakarak "en iyi yolu" seçmesi.
              </li>
            </ul>
          </Card>
          <Card title="Temel Kavram">
            <p className="mb-4">
              <strong>Routing</strong>, veri paketlerinin bir ağ içinde veya
              ağlar arasında kaynaktan hedefe en verimli yol üzerinden
              iletilmesi sürecidir. Bu işi yapan cihazlara{" "}
              <strong>Router (Yönlendirici)</strong> denir.
            </p>
          </Card>
        </div>
      </Section>

      {/* İnteraktif Simülasyon */}
      <Section title="İnteraktif Simülasyon: Bir Paket Nasıl Yolunu Bulur?">
        <Card>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Görsel Topoloji */}
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed">
              <div className="relative flex justify-between items-center">
                {/* Sol Taraf (Kaynak) */}
                <div className="text-center">
                  <PcCase size={48} className="mx-auto text-blue-600" />
                  <p className="font-bold mt-2">PC-A</p>
                  <p className="text-sm text-gray-600">192.168.1.10</p>
                </div>
                {/* Sağ Taraf (Hedef) */}
                <div className="text-center">
                  <Server size={48} className="mx-auto text-green-600" />
                  <p className="font-bold mt-2">Server-B</p>
                  <p className="text-sm text-gray-600">192.168.2.20</p>
                </div>
                {/* Packet Icon */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out 
                    ${packetPosition === "start" && "left-[10%] opacity-0"}
                    ${packetPosition === "router1" && "left-[30%] opacity-100"}
                    ${packetPosition === "router2" && "left-[60%] opacity-100"}
                    ${packetPosition === "end" && "left-[85%] opacity-100"}`}
                >
                  <Mail size={32} className="text-yellow-500" />
                </div>
              </div>

              {/* Router'lar ve Bağlantılar */}
              <div className="relative h-2 bg-gray-300 my-8 rounded">
                <div className="absolute top-1/2 -translate-y-1/2 left-[30%] text-center">
                  <Server
                    size={32}
                    className="mx-auto text-gray-700 bg-gray-100"
                  />
                  <p className="text-xs font-semibold">Router-1</p>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 left-[60%] text-center">
                  <Server
                    size={32}
                    className="mx-auto text-gray-700 bg-gray-100"
                  />
                  <p className="text-xs font-semibold">Router-2</p>
                </div>
              </div>
            </div>

            {/* Kontrol ve Log Paneli */}
            <div>
              <p className="mb-4">
                Aşağıdaki butona basarak <strong>PC-A</strong>'dan{" "}
                <strong>Server-B</strong>'ye bir paket gönderin ve router'ların
                bu paketi nasıl yönlendirdiğini adım adım izleyin.
              </p>
              <button
                onClick={handleSendPacket}
                disabled={isSimulating}
                className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSimulating ? "Simülasyon Çalışıyor..." : "Paket Gönder"}
              </button>
              <CodeBlock title="Olay Günlüğü (Router Logları)">
                {logs.length > 0
                  ? logs.map((log, index) => (
                      <p key={index} className="whitespace-pre-wrap">
                        {log}
                      </p>
                    ))
                  : "Simülasyonu başlatmak için butona basın."}
              </CodeBlock>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
};

export default HomePage;
