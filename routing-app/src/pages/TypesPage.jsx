// Dosya Yolu: src/pages/TypesPage.jsx

import React, { useState } from "react";
import Section from "../components/organisms/Section";
import Card from "../components/molecules/Card";
import CodeBlock from "../components/molecules/CodeBlock";
import {
  PcCase,
  Server,
  CheckCircle,
  XCircle,
  ArrowRight,
  Route,
  Ban,
} from "lucide-react";

// Simülasyon için bekleme fonksiyonu
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Her bir tab için ayrı simülasyon component'i
const RoutingSimulator = ({ type }) => {
  const [logs, setLogs] = useState([]);
  const [isLink1Up, setIsLink1Up] = useState(true);
  const [packetStatus, setPacketStatus] = useState("idle"); // idle, success, fail
  const [isSimulating, setIsSimulating] = useState(false);

  const resetSimulation = () => {
    setLogs([]);
    setPacketStatus("idle");
  };

  const handleSendPacket = async () => {
    resetSimulation();
    setIsSimulating(true);

    if (type === "static") {
      setLogs((prev) => [
        ...prev,
        "Statik yönlendirme seçili. Router sadece Link 1'i kullanmak üzere programlandı.",
      ]);
      await delay(1500);
      if (isLink1Up) {
        setLogs((prev) => [
          ...prev,
          "Link 1 aktif. Paket Link 1 üzerinden gönderiliyor...",
        ]);
        setPacketStatus("success");
      } else {
        setLogs((prev) => [
          ...prev,
          "HATA: Link 1 kopuk! Router'ın başka bir yol bilgisi yok.",
        ]);
        await delay(1000);
        setLogs((prev) => [...prev, "Paket hedefe ulaşamadı ve atıldı."]);
        setPacketStatus("fail");
      }
    }

    if (type === "dynamic") {
      setLogs((prev) => [
        ...prev,
        "Dinamik yönlendirme (OSPF gibi) seçili. Router en iyi yolu kendi bulur.",
      ]);
      await delay(1500);
      if (isLink1Up) {
        setLogs((prev) => [
          ...prev,
          "OSPF, en iyi yol olarak Link 1'i belirledi. Paket gönderiliyor...",
        ]);
        setPacketStatus("success");
      } else {
        setLogs((prev) => [
          ...prev,
          "UYARI: Link 1 kopuk! OSPF durumu fark etti.",
        ]);
        await delay(1500);
        setLogs((prev) => [
          ...prev,
          "Yeniden hesaplama (Convergence) yapılıyor...",
        ]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "Yeni en iyi yol bulundu: Link 2! Paket Link 2 üzerinden gönderiliyor...",
        ]);
        setPacketStatus("success_alt"); // Alternatif yoldan başarı
      }
    }

    setIsSimulating(false);
  };

  return (
    <Card className="mt-6">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Görsel Topoloji */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <PcCase size={32} className="mx-auto" />
              <p className="text-sm font-bold">Siz</p>
            </div>
            {packetStatus === "success" && (
              <CheckCircle size={32} className="text-green-500" />
            )}
            {packetStatus === "success_alt" && (
              <CheckCircle size={32} className="text-blue-500" />
            )}
            {packetStatus === "fail" && (
              <XCircle size={32} className="text-red-500" />
            )}
            <div className="text-center">
              <Server size={32} className="mx-auto" />
              <p className="text-sm font-bold">Server</p>
            </div>
          </div>
          {/* Bağlantılar */}
          <div className="space-y-3">
            <div
              className={`flex items-center justify-center p-2 rounded transition-colors ${
                isLink1Up ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <p
                className={`font-semibold text-sm ${
                  isLink1Up ? "text-green-800" : "text-red-800"
                }`}
              >
                Link 1 (Ana Yol)
              </p>
              <div
                className={`flex-grow h-1 mx-4 rounded ${
                  isLink1Up ? "bg-green-500" : "bg-red-500 line-through"
                }`}
              ></div>
              {packetStatus === "success" && (
                <ArrowRight className="text-green-600 animate-pulse" />
              )}
            </div>
            <div className="flex items-center justify-center bg-blue-100 p-2 rounded">
              <p className="font-semibold text-sm text-blue-800">
                Link 2 (Yedek Yol)
              </p>
              <div className="flex-grow h-1 mx-4 rounded bg-blue-500"></div>
              {packetStatus === "success_alt" && (
                <ArrowRight className="text-blue-600 animate-pulse" />
              )}
            </div>
          </div>
        </div>
        {/* Kontrol Paneli */}
        <div>
          <button
            onClick={() => setIsLink1Up(!isLink1Up)}
            className="w-full mb-4 font-semibold py-2 px-4 rounded border-2 hover:bg-gray-100"
          >
            {isLink1Up ? "🚨 Link 1'i Kopar" : " tamir et"}
          </button>
          <button
            onClick={handleSendPacket}
            disabled={isSimulating}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSimulating ? "..." : "Paket Gönder"}
          </button>
          <CodeBlock title="Router Davranışı">
            {logs.length > 0
              ? logs.map((log, i) => <p key={i}>{log}</p>)
              : 'Başlamak için "Paket Gönder" butonuna basın.'}
          </CodeBlock>
        </div>
      </div>
    </Card>
  );
};

const TypesPage = () => {
  const [activeTab, setActiveTab] = useState("static");

  return (
    <Section title="Routing Türleri">
      <p className="text-center max-w-2xl mx-auto mb-8">
        Router'lar yolları farklı yöntemlerle öğrenebilir. Her yöntemin kendine
        özgü avantajları ve dezavantajları vardır. Aşağıdaki simülasyonlarla bu
        farkları canlı olarak test edin.
      </p>

      {/* Tab Butonları */}
      <div className="flex justify-center space-x-2 bg-white p-1 rounded-lg shadow-sm w-fit mx-auto mb-6">
        <button
          onClick={() => setActiveTab("static")}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === "static"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Static Routing
        </button>
        <button
          onClick={() => setActiveTab("dynamic")}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === "dynamic"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Dynamic Routing
        </button>
      </div>

      {/* Tab İçerikleri */}
      <div>
        {activeTab === "static" && (
          <Card title="Static Routing: Manuel Rehber">
            <p>
              Yolların bir ağ yöneticisi tarafından tek tek, elle
              yapılandırıldığı yöntemdir. Router, kendisine ne söylendiyse
              sadece onu yapar; alternatif yolları kendi başına bulamaz.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-3 rounded">
                <strong>Avantaj:</strong> Güvenli, tahmin edilebilir ve
                işlemciyi yormaz.
              </div>
              <div className="bg-red-50 p-3 rounded">
                <strong>Dezavantaj:</strong> Ağdaki değişikliklere (kopan bir
                hat gibi) uyum sağlayamaz, yönetim zorluğu.
              </div>
            </div>
            <RoutingSimulator type="static" />
          </Card>
        )}
        {activeTab === "dynamic" && (
          <Card title="Dynamic Routing: Akıllı Navigasyon">
            <p>
              Router'ların, özel protokoller (OSPF, EIGRP gibi) kullanarak
              birbirleriyle konuşup en iyi yolları otomatik olarak öğrendiği
              yöntemdir. Tıpkı canlı trafik bilgisi alan bir navigasyon cihazı
              gibidir.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-3 rounded">
                <strong>Avantaj:</strong> Ağdaki değişikliklere otomatik uyum
                sağlar, en verimli yolu kendi bulur.
              </div>
              <div className="bg-red-50 p-3 rounded">
                <strong>Dezavantaj:</strong> Yapılandırması daha karmaşıktır ve
                işlemci gücü gerektirir.
              </div>
            </div>
            <RoutingSimulator type="dynamic" />
          </Card>
        )}
      </div>
    </Section>
  );
};

export default TypesPage;
