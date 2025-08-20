// Dosya Yolu: src/pages/ProtocolsPage.jsx

import React, { useState, useEffect } from "react";
import Section from "../components/organisms/Section";
import Card from "../components/molecules/Card";
import CodeBlock from "../components/molecules/CodeBlock";
import {
  Network,
  Server,
  Route,
  Globe,
  CheckCircle,
  XCircle,
  Building,
  ArrowRight,
} from "lucide-react";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Oyunun bölümlerini içeren veri yapısı
const chapters = [
  {
    id: "rip-mission",
    title: "Görev 1: ByteCorp'un İlk Ofisi",
    story:
      "Tebrikler! ByteCorp'taki ilk günün. Şirketimiz küçük, sadece birkaç departman var ve bunları birbirine bağlamamız gerekiyor. Ağımız basit, bu yüzden hızlı ve kolay bir çözüme ihtiyacımız var.",
    task: "Aşağıdaki basit ağ için en uygun, en temel yönlendirme protokolünü seçerek departmanların birbiriyle konuşmasını sağla.",
    topology: `
    (PC-A) --- (Router 1) --- (Router 2) --- (Router 3) --- (Server-B)
    `,
    protocols: [
      {
        id: "RIP",
        name: "RIP",
        description:
          'Basit ve eski bir protokol. En az "atlama" (hop) sayısına göre yolunu bulur.',
      },
      {
        id: "OSPF",
        name: "OSPF",
        description:
          "Daha akıllı bir protokol. Hattın hızını (maliyetini) dikkate alarak en hızlı yolu seçer.",
      },
    ],
    correctProtocol: "RIP",
    runSimulation: async (protocolId, setLogs) => {
      if (protocolId === "RIP") {
        setLogs((prev) => [...prev, "RIP seçildi. Aktivasyon..."]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "RIP, hedefe giden yolu sayıyor: 1... 2... 3 atlama.",
        ]);
        await delay(1500);
        setLogs((prev) => [
          ...prev,
          "En kısa yol bu olduğu için paket başarıyla iletildi!",
        ]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "✅ SONUÇ: Küçük ve basit ağlarda RIP, kurulumu kolay olduğu için mükemmel bir seçimdir.",
        ]);
        return "success";
      }
      if (protocolId === "OSPF") {
        setLogs((prev) => [...prev, "OSPF seçildi. Aktivasyon..."]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "OSPF, komşu router'larla durum bilgisi paylaşıyor...",
        ]);
        await delay(1500);
        setLogs((prev) => [
          ...prev,
          "Ağ haritası oluşturuldu ve en hızlı yol seçildi. Paket iletildi.",
        ]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "⚠️ SONUÇ: OSPF de çalıştı, ancak bu kadar basit bir ağ için gereksiz yere karmaşık ve kaynak tüketen bir seçimdi. 'Sinek öldürmek için balyoz kullanmak' gibi.",
        ]);
        return "warning"; // Başarılı ama en iyi seçim değil
      }
    },
  },
  {
    id: "ospf-mission",
    title: "Görev 2: ByteCorp Büyüyor!",
    story:
      "Harika iş! Şirket büyüdü ve yeni bir veri merkezi kurduk. Artık sunucularımıza giden iki yol var: biri eski ve yavaş (ama daha az router'dan geçiyor), diğeri ise yeni ve süper hızlı fiber hat!",
    task: "Veri paketlerinin her zaman en HIZLI yoldan gitmesini sağlayacak akıllı protokolü seç.",
    topology: `
                 (Yavaş Hat: 2 atlama)
    (PC-A) --- R1 --------------------- R2 --- (Server-B)
               |                        |
               --- R3 --- R4 --- R5 ---
                 (Hızlı Fiber Hat: 4 atlama)
    `,
    protocols: [
      {
        id: "RIP",
        name: "RIP",
        description: 'En az "atlama" (hop) sayısına göre karar verir.',
      },
      {
        id: "OSPF",
        name: "OSPF",
        description: "Hattın hızını (maliyetini) hesaba katar.",
      },
    ],
    correctProtocol: "OSPF",
    runSimulation: async (protocolId, setLogs) => {
      if (protocolId === "RIP") {
        setLogs((prev) => [...prev, "RIP seçildi. Yol hesaplanıyor..."]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "RIP, yolları sayıyor: Üst yol (2 atlama), Alt yol (4 atlama).",
        ]);
        await delay(1500);
        setLogs((prev) => [
          ...prev,
          "RIP, 'daha az atlama daha iyidir' diyerek YAVAŞ olan üst yolu seçti.",
        ]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "❌ SONUÇ: Paket hedefe ulaştı ama en verimsiz yoldan! RIP, hat hızını anlayamadığı için bu senaryoda başarısız oldu.",
        ]);
        return "fail";
      }
      if (protocolId === "OSPF") {
        setLogs((prev) => [
          ...prev,
          "OSPF seçildi. Yol maliyetleri hesaplanıyor...",
        ]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "OSPF, yol maliyetlerini analiz ediyor: Üst yol (Maliyet: 100), Alt Fiber yol (Maliyet: 10).",
        ]);
        await delay(1500);
        setLogs((prev) => [
          ...prev,
          "OSPF, 'daha düşük maliyet daha iyidir' diyerek HIZLI olan alt yolu seçti.",
        ]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "✅ SONUÇ: Harika seçim! OSPF, ağın hızını anlayarak en verimli yolu buldu. Büyüyen ağlar için idealdir.",
        ]);
        return "success";
      }
    },
  },
  {
    id: "bgp-mission",
    title: "Görev 3: ByteCorp Dünyaya Açılıyor!",
    story:
      "İnanılmaz! ByteCorp artık global bir şirket. Kendi ağımızı (AS 65001) İnternet Servis Sağlayıcımıza (AS 8800) bağlayıp tüm dünyaya hizmet vermemiz gerekiyor. Bu çok farklı bir oyun.",
    task: "Şirket ağımızı internete bağlamak için kullanılan tek ve standart protokolü seç.",
    topology: `
    +----------------+                +-----------------+
    | ByteCorp Ağı   |                |  İnternet (ISP) |
    |   (AS 65001)   | --- (Sınır R1) === (Sınır R2) --- |   (Diğer Şirketler)
    +----------------+                +-----------------+
    `,
    protocols: [
      {
        id: "OSPF",
        name: "OSPF",
        description: "Kendi şirket ağımız İÇİNDE en iyi yolları bulur.",
      },
      {
        id: "BGP",
        name: "BGP",
        description:
          "Farklı şirket ağları (AS) ARASINDA yol bilgisi paylaşır. İnternet'in protokolüdür.",
      },
    ],
    correctProtocol: "BGP",
    runSimulation: async (protocolId, setLogs) => {
      if (protocolId === "OSPF") {
        setLogs((prev) => [...prev, "OSPF seçildi..."]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "OSPF, komşu router'a (ISP) merhaba diyor ama ISP'nin router'ı OSPF konuşmuyor! Onlar farklı bir 'dil' kullanıyor.",
        ]);
        await delay(1500);
        setLogs((prev) => [...prev, "Bağlantı kurulamadı."]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "❌ SONUÇ: OSPF bir 'İç Ağ Geçidi Protokolü'dür (IGP). Sadece kendi şirket ağımız içinde çalışır, dış dünyayla konuşamaz.",
        ]);
        return "fail";
      }
      if (protocolId === "BGP") {
        setLogs((prev) => [...prev, "BGP seçildi. Aktivasyon..."]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "Sınır router'ımız, ISP'nin router'ı ile bir BGP komşuluğu kuruyor...",
        ]);
        await delay(1500);
        setLogs((prev) => [
          ...prev,
          "Yol bilgileri (AS Path) paylaşılıyor. Artık ağımız internetin bir parçası!",
        ]);
        await delay(1000);
        setLogs((prev) => [
          ...prev,
          "✅ SONUÇ: Mükemmel! BGP, farklı otonom sistemleri (şirketler, servis sağlayıcılar) birbirine bağlayan tek protokoldür. ByteCorp artık global!",
        ]);
        return "success";
      }
    },
  },
];

const ProtocolsPage = () => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [missionStatus, setMissionStatus] = useState("pending"); // pending, success, fail, warning

  const chapter = chapters[currentChapter];

  const handleProtocolSelect = async (protocolId) => {
    setIsSimulating(true);
    setMissionStatus("pending");
    setLogs([]);
    const result = await chapter.runSimulation(protocolId, setLogs);
    setMissionStatus(result);
    setIsSimulating(false);
  };

  const handleNextChapter = () => {
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
      setLogs([]);
      setMissionStatus("pending");
    }
  };

  const handleRetry = () => {
    setLogs([]);
    setMissionStatus("pending");
  };

  return (
    <Section title="Routing Protokolleri Macerası">
      <p className="text-center max-w-3xl mx-auto mb-8 text-lg">
        ByteCorp'un yeni ağ mühendisi olarak işe başladın. Şirket büyüdükçe ağın
        ihtiyaçları değişecek. Her görevde doğru protokolü seçerek şirketi
        başarıya taşı!
      </p>

      <Card>
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Sol Panel: Hikaye ve Görev */}
          <div>
            <h3 className="text-2xl font-bold text-blue-700 mb-4">
              {chapter.title}
            </h3>
            <p className="mb-4 italic text-gray-600">{chapter.story}</p>
            <p className="mb-4 font-semibold">{chapter.task}</p>
            <CodeBlock title="Ağ Topolojisi">{chapter.topology}</CodeBlock>
          </div>

          {/* Sağ Panel: Simülasyon ve Kontrol */}
          <div>
            <h4 className="text-xl font-bold mb-4">Protokol Seçim Paneli</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {chapter.protocols.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProtocolSelect(p.id)}
                  disabled={isSimulating}
                  className="p-4 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-bold text-lg">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.description}</p>
                </button>
              ))}
            </div>

            <CodeBlock title="Simülasyon Günlüğü">
              {logs.length > 0
                ? logs.map((log, i) => (
                    <p
                      key={i}
                      className={`whitespace-pre-wrap ${
                        log.includes("✅") ? "text-green-400" : ""
                      } ${log.includes("❌") ? "text-red-400" : ""} ${
                        log.includes("⚠️") ? "text-yellow-400" : ""
                      }`}
                    >
                      {log}
                    </p>
                  ))
                : "Bir protokol seçerek simülasyonu başlat."}
            </CodeBlock>

            {/* Sonuç ve İlerleme Butonları */}
            {missionStatus === "success" || missionStatus === "warning" ? (
              <div className="p-4 bg-green-100 text-green-800 rounded-lg text-center">
                <CheckCircle className="mx-auto mb-2" size={32} />
                <p className="font-bold">Görev Başarılı!</p>
                {currentChapter < chapters.length - 1 ? (
                  <button
                    onClick={handleNextChapter}
                    className="mt-2 bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700"
                  >
                    Sonraki Göreve Geç <ArrowRight className="inline" />
                  </button>
                ) : (
                  <p className="mt-2">Tebrikler, Macerayı Tamamladın!</p>
                )}
              </div>
            ) : null}
            {missionStatus === "fail" ? (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg text-center">
                <XCircle className="mx-auto mb-2" size={32} />
                <p className="font-bold">Görev Başarısız!</p>
                <p className="text-sm">Logları incele ve nedenini anla.</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </Section>
  );
};

export default ProtocolsPage;
