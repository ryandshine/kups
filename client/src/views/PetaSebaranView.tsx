import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { fetchMapGeoJson, fetchCommodityDistribution, CommodityDistributionQuery } from '../api';
import { CommodityDistributionResponse, CommodityProvinceStat } from '../types';
import { 
  MapPin, 
  Layers, 
  Banknote, 
  Sprout, 
  Info, 
  X, 
  Maximize2,
  Building2,
  TrendingUp,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

interface SelectedProvince {
  name: string;
  total_kups: number;
  count_biru: number;
  count_perak: number;
  count_emas: number;
  count_platinum: number;
  total_nilai_ekonomi: number;
  total_komoditas: number;
  top_commodities: { komoditas: string; total_nilai: number; kategori: string }[];
  skema_distribution?: { skema: string; count: number }[];
}

const PROVINCE_SHORT_NAMES: Record<string, string> = {
  'Aceh': 'Aceh',
  'Sumatera Utara': 'Sumut',
  'Sumatera Barat': 'Sumbar',
  'Riau': 'Riau',
  'Jambi': 'Jambi',
  'Sumatera Selatan': 'Sumsel',
  'Bengkulu': 'Bengkulu',
  'Lampung': 'Lampung',
  'Kepulauan Bangka Belitung': 'Babel',
  'Kepulauan Riau': 'Kepri',
  'DKI Jakarta': 'DKI',
  'Jawa Barat': 'Jabar',
  'Jawa Tengah': 'Jateng',
  'Daerah Istimewa Yogyakarta': 'DIY',
  'Jawa Timur': 'Jatim',
  'Banten': 'Banten',
  'Bali': 'Bali',
  'Nusa Tenggara Barat': 'NTB',
  'Nusa Tenggara Timur': 'NTT',
  'Kalimantan Barat': 'Kalbar',
  'Kalimantan Tengah': 'Kalteng',
  'Kalimantan Selatan': 'Kalsel',
  'Kalimantan Timur': 'Kaltim',
  'Kalimantan Utara': 'Kaltara',
  'Sulawesi Utara': 'Sulut',
  'Sulawesi Tengah': 'Sulteng',
  'Sulawesi Selatan': 'Sulsel',
  'Sulawesi Tenggara': 'Sultra',
  'Gorontalo': 'Gorontalo',
  'Sulawesi Barat': 'Sulbar',
  'Maluku': 'Maluku',
  'Maluku Utara': 'Malut',
  'Papua Barat': 'Papua Brt',
  'Papua': 'Papua',
  'Papua Selatan': 'Papua Sel',
  'Papua Tengah': 'Papua Tgh',
  'Papua Pegunungan': 'Papua Peg',
  'Papua Barat Daya': 'Papua BD',
};

const POPULAR_COMMODITY_CHIPS = [
  'BIJI KOPI',
  'JAGUNG',
  'TBS',
  'BIJI KEMIRI',
  'PALA',
  'GETAH PINUS',
  'PERIKANAN',
  'KAKAO',
  'DAMAR',
  'EKOWISATA',
  'DURIAN',
  'MADU',
  'ROTAN',
  'BAMBU',
  'AREN'
];

export const PetaSebaranView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Mode: 'wilayah' (Overview KUPS & Nilai) or 'komoditas' (Peta Sebaran Komoditas)
  const [mapMode, setMapMode] = useState<'wilayah' | 'komoditas'>('komoditas');

  // Base GeoJSON data
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wilayah Mode States
  const [activeMetric, setActiveMetric] = useState<'nilai' | 'kups'>('nilai');
  const [selectedProvince, setSelectedProvince] = useState<SelectedProvince | null>(null);

  // Komoditas Mode States
  const [commodityData, setCommodityData] = useState<CommodityDistributionResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('BIJI KOPI');
  const [commoditySearch, setCommoditySearch] = useState<string>('');
  const [loadingCommodity, setLoadingCommodity] = useState<boolean>(false);
  const [selectedProvinceCommodity, setSelectedProvinceCommodity] = useState<CommodityProvinceStat | null>(null);

  // Common Map States
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
  const formatRupiah = (val: number) => {
    if (!val) return 'Rp 0';
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(2)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatRupiahShort = (val: number) => {
    if (!val || val === 0) return 'Rp 0';
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(1)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(val >= 10_000_000_000 ? 0 : 1)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)} Jt`;
    return `Rp ${(val / 1_000).toFixed(0)} Rb`;
  };

  // Color scales for Wilayah Mode
  const getWilayahColor = (val: number, metric: 'nilai' | 'kups') => {
    if (metric === 'nilai') {
      if (val > 1_000_000_000_000) return '#7C2D12';
      if (val > 300_000_000_000) return '#9A3412';
      if (val > 100_000_000_000) return '#C2410C';
      if (val > 30_000_000_000) return '#EA580C';
      if (val > 5_000_000_000) return '#F97316';
      if (val > 0) return '#FDBA74';
      return '#E7E0D3';
    } else {
      if (val > 800) return '#14532D';
      if (val > 400) return '#166534';
      if (val > 200) return '#15803D';
      if (val > 100) return '#22C55E';
      if (val > 20) return '#86EFAC';
      if (val > 0) return '#BBF7D0';
      return '#E7E0D3';
    }
  };

  // Dynamic Color scales for Commodity Mode
  const getCommodityColor = (val: number, maxVal: number) => {
    if (!val || val <= 0) return '#E7E0D3'; // 0 production / grayed out
    if (maxVal <= 0) return '#FDBA74';

    const ratio = val / maxVal;
    if (ratio >= 0.5) return '#7C2D12';  // > 50% of top producer (Deep Rust Terracotta)
    if (ratio >= 0.2) return '#9A3412';  // 20% - 50% (Burnt Ochre)
    if (ratio >= 0.08) return '#C2410C'; // 8% - 20% (Warm Terracotta)
    if (ratio >= 0.02) return '#EA580C'; // 2% - 8% (Bright Terracotta)
    if (ratio >= 0.005) return '#F97316';// 0.5% - 2% (Ochre Amber)
    return '#FDBA74';                    // > 0% (Light Peach Amber)
  };

  // Load initial Base GeoJSON
  useEffect(() => {
    fetchMapGeoJson()
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Load Commodity Distribution Data
  useEffect(() => {
    setLoadingCommodity(true);
    const query: CommodityDistributionQuery = {
      komoditas: selectedCommodity,
      kategori: selectedCategory !== 'ALL' ? selectedCategory : undefined,
    };

    fetchCommodityDistribution(query)
      .then((res) => {
        setCommodityData(res);
        setLoadingCommodity(false);
        // Default select top producing province if available
        if (res.provinces && res.provinces.length > 0) {
          setSelectedProvinceCommodity(res.provinces[0]);
        } else {
          setSelectedProvinceCommodity(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load commodity distribution:', err);
        setLoadingCommodity(false);
      });
  }, [selectedCommodity, selectedCategory]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !geoData || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-1.8, 118.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 9,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    renderMapLayers(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [geoData]);

  // Re-render layer when mode or controls change
  useEffect(() => {
    if (mapInstanceRef.current && geoData) {
      renderMapLayers(mapInstanceRef.current);
    }
  }, [mapMode, activeMetric, showLabels, geoData, commodityData]);

  const renderMapLayers = (map: L.Map) => {
    if (!geoData) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    if (mapMode === 'wilayah') {
      // MODE 1: Peta Wilayah KUPS & Nilai
      const layer = L.geoJSON(geoData, {
        style: (feature) => {
          const props = feature?.properties || {};
          const val = activeMetric === 'nilai' ? (props.total_nilai_ekonomi || 0) : (props.total_kups || 0);
          return {
            fillColor: getWilayahColor(val, activeMetric),
            weight: 1,
            opacity: 1,
            color: '#2C2825',
            fillOpacity: 0.9,
          };
        },
        onEachFeature: (feature, l) => {
          const props = feature.properties || {};
          const provName = props.PROVINSI || props.provinsi || 'Wilayah';
          const kupsVal = props.total_kups || 0;
          const nilaiVal = props.total_nilai_ekonomi || 0;
          const shortName = PROVINCE_SHORT_NAMES[provName] || provName.replace('Provinsi ', '').trim();

          if (showLabels) {
            const tooltipHtml = activeMetric === 'nilai' ? `
              <div style="text-align: center; pointer-events: none; user-select: none;">
                <div style="font-size: 8.5px; font-weight: 700; color: #E7E5E4; text-transform: uppercase;">${shortName}</div>
                <div style="font-size: 11px; font-weight: 800; color: #FCD34D; font-family: monospace;">${formatRupiahShort(nilaiVal)}</div>
                <div style="font-size: 8.5px; color: #D6D3D1; font-family: monospace;">${formatNumber(kupsVal)} KUPS</div>
              </div>
            ` : `
              <div style="text-align: center; pointer-events: none; user-select: none;">
                <div style="font-size: 8.5px; font-weight: 700; color: #E7E5E4; text-transform: uppercase;">${shortName}</div>
                <div style="font-size: 11.5px; font-weight: 800; color: #6EE7B7; font-family: monospace;">${formatNumber(kupsVal)} <span style="font-size: 8.5px; font-weight: 400; color: #FFFFFF;">KUPS</span></div>
                <div style="font-size: 8.5px; color: #FDE68A; font-family: monospace;">${formatRupiahShort(nilaiVal)}</div>
              </div>
            `;

            (l as any).bindTooltip(tooltipHtml, {
              permanent: true,
              direction: 'center',
              className: 'province-map-label',
            });
          }

          l.on({
            mouseover: (e) => {
              const currentLayer = e.target;
              currentLayer.setStyle({ weight: 2.5, color: '#000000', fillOpacity: 1 });
              currentLayer.bringToFront();
              setHoveredName(provName);
            },
            mouseout: (e) => {
              geojsonLayerRef.current?.resetStyle(e.target);
              setHoveredName(null);
            },
            click: () => {
              setSelectedProvince({
                name: provName,
                total_kups: props.total_kups || 0,
                count_biru: props.count_biru || 0,
                count_perak: props.count_perak || 0,
                count_emas: props.count_emas || 0,
                count_platinum: props.count_platinum || 0,
                total_nilai_ekonomi: props.total_nilai_ekonomi || 0,
                total_komoditas: props.total_komoditas || 0,
                top_commodities: props.top_commodities || [],
                skema_distribution: props.skema_distribution || [],
              });
            },
          });
        },
      });

      layer.addTo(map);
      geojsonLayerRef.current = layer;

      if (!selectedProvince) {
        const initial = geoData.features?.find((f: any) => f.properties?.PROVINSI?.includes('Jawa Timur') || f.properties?.total_nilai_ekonomi > 1_000_000_000_000) || geoData.features?.[0];
        if (initial) {
          const p = initial.properties;
          setSelectedProvince({
            name: p.PROVINSI,
            total_kups: p.total_kups || 0,
            count_biru: p.count_biru || 0,
            count_perak: p.count_perak || 0,
            count_emas: p.count_emas || 0,
            count_platinum: p.count_platinum || 0,
            total_nilai_ekonomi: p.total_nilai_ekonomi || 0,
            total_komoditas: p.total_komoditas || 0,
            top_commodities: p.top_commodities || [],
            skema_distribution: p.skema_distribution || [],
          });
        }
      }
    } else {
      // MODE 2: Peta Sebaran Komoditas (Spasial Komoditas Terpilih)
      const provMap = new Map<string, CommodityProvinceStat>();
      let maxVal = 0;
      if (commodityData?.provinces) {
        for (const p of commodityData.provinces) {
          provMap.set(p.normalized_name, p);
          if (p.total_nilai > maxVal) maxVal = p.total_nilai;
        }
      }

      const layer = L.geoJSON(geoData, {
        style: (feature) => {
          const rawName = feature?.properties?.PROVINSI || feature?.properties?.name || '';
          const normName = rawName.toUpperCase().replace(/^PROVINSI\s+/, '').replace(/^DAERAH\s+ISTIMEWA\s+/, 'D I ').replace(/^DKI\s+/, 'D K I ').replace(/KEP\.\s*/, 'KEPULAUAN ').replace(/[\s\-_]+/g, ' ').trim();
          const pStat = provMap.get(normName);
          const val = pStat?.total_nilai || 0;

          return {
            fillColor: getCommodityColor(val, maxVal),
            weight: val > 0 ? 1.5 : 1,
            opacity: 1,
            color: val > 0 ? '#1C1917' : '#A8A29E',
            fillOpacity: val > 0 ? 0.92 : 0.45,
          };
        },
        onEachFeature: (feature, l) => {
          const provName = feature.properties?.PROVINSI || feature.properties?.name || 'Wilayah';
          const normName = provName.toUpperCase().replace(/^PROVINSI\s+/, '').replace(/^DAERAH\s+ISTIMEWA\s+/, 'D I ').replace(/^DKI\s+/, 'D K I ').replace(/KEP\.\s*/, 'KEPULAUAN ').replace(/[\s\-_]+/g, ' ').trim();
          const pStat = provMap.get(normName);
          const comVal = pStat?.total_nilai || 0;
          const txCount = pStat?.transaksi_count || 0;
          const rank = pStat?.rank;
          const shortName = PROVINCE_SHORT_NAMES[provName] || provName.replace('Provinsi ', '').trim();

          if (showLabels) {
            const tooltipHtml = comVal > 0 ? `
              <div style="text-align: center; pointer-events: none; user-select: none;">
                <div style="font-size: 8.5px; font-weight: 700; color: #E7E5E4; text-transform: uppercase;">${shortName}</div>
                <div style="font-size: 11px; font-weight: 800; color: #FCD34D; font-family: monospace;">${formatRupiahShort(comVal)}</div>
                <div style="font-size: 8.5px; color: #86EFAC; font-family: monospace;">#${rank} Sentra (${pStat?.percentage}%)</div>
              </div>
            ` : `
              <div style="text-align: center; pointer-events: none; user-select: none; opacity: 0.65;">
                <div style="font-size: 8px; color: #D6D3D1;">${shortName}</div>
                <div style="font-size: 9px; color: #A8A29E;">-</div>
              </div>
            `;

            (l as any).bindTooltip(tooltipHtml, {
              permanent: true,
              direction: 'center',
              className: 'province-map-label',
            });
          }

          l.on({
            mouseover: (e) => {
              const currentLayer = e.target;
              currentLayer.setStyle({ weight: 2.5, color: '#000000', fillOpacity: 1 });
              currentLayer.bringToFront();
              setHoveredName(provName);
            },
            mouseout: (e) => {
              geojsonLayerRef.current?.resetStyle(e.target);
              setHoveredName(null);
            },
            click: () => {
              if (pStat) {
                setSelectedProvinceCommodity(pStat);
              } else {
                setSelectedProvinceCommodity({
                  provinsi: provName,
                  normalized_name: normName,
                  total_nilai: 0,
                  transaksi_count: 0,
                  lembaga_count: 0,
                  percentage: 0,
                  rank: 0,
                });
              }
            },
          });
        },
      });

      layer.addTo(map);
      geojsonLayerRef.current = layer;
    }
  };

  const handleResetZoom = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-1.8, 118.0], 5);
    }
  };

  const handleSelectProvinceOnMap = (provName: string) => {
    const norm = provName.toUpperCase().replace(/^PROVINSI\s+/, '').replace(/^DAERAH\s+ISTIMEWA\s+/, 'D I ').replace(/^DKI\s+/, 'D K I ').replace(/KEP\.\s*/, 'KEPULAUAN ').replace(/[\s\-_]+/g, ' ').trim();
    const stat = commodityData?.provinces.find((p) => p.normalized_name === norm);
    if (stat) {
      setSelectedProvinceCommodity(stat);
    }
  };

  // Filtered commodity list for the dropdown
  const filteredCommodityList = (commodityData?.top_commodities || []).filter((c) => {
    if (selectedCategory !== 'ALL' && c.kategori_komoditas !== selectedCategory) return false;
    if (commoditySearch && !c.komoditas.toLowerCase().includes(commoditySearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border-2 border-earth-sand-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-earth-forest text-white text-xs px-2.5 py-1 mb-2">
            <Sprout className="w-3.5 h-3.5" />
            <span>SISTEM INFORMASI GEOGRAFIS KOMODITAS PERHUTANAN SOSIAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-earth-soil flex items-center space-x-2">
            <MapPin className="w-7 h-7 text-earth-forest" />
            <span>Peta Spasial Sebaran Komoditas & Nilai Ekonomi</span>
          </h1>
          <p className="text-xs text-earth-soil-muted mt-1 max-w-3xl leading-relaxed">
            Eksplorasi spasial interaktif sebaran 170 komoditas unggulan (HHBK, Kayu, Jasa Lingkungan) dan pemantauan sentra produksi perhutanan sosial di 38 provinsi Indonesia.
          </p>
        </div>

        {/* Tab Switcher: Wilayah vs Komoditas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex border-2 border-earth-sand-border bg-earth-sand-surface p-1">
            <button
              onClick={() => setMapMode('komoditas')}
              className={`px-4 py-2 text-xs font-bold transition-all flex items-center space-x-1.5 ${
                mapMode === 'komoditas'
                  ? 'bg-earth-terracotta text-white shadow-sm'
                  : 'text-earth-soil hover:text-earth-terracotta'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>Peta Sebaran Komoditas</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-amber-400 text-stone-900 font-extrabold">
                UTAMA
              </span>
            </button>
            <button
              onClick={() => setMapMode('wilayah')}
              className={`px-4 py-2 text-xs font-bold transition-all flex items-center space-x-1.5 ${
                mapMode === 'wilayah'
                  ? 'bg-earth-forest text-white shadow-sm'
                  : 'text-earth-soil hover:text-earth-forest'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Peta Wilayah & Kelas KUPS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COMMODITY DISTRIBUTION SUB-HEADER FILTER BAR (When in Komoditas Mode) */}
      {/* ========================================================================= */}
      {mapMode === 'komoditas' && (
        <section className="bg-white border-2 border-earth-sand-border p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-earth-sand-border">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-earth-soil uppercase mr-1 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-earth-forest" />
                <span>Kategori:</span>
              </span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'border-earth-terracotta bg-earth-terracotta text-white'
                    : 'border-earth-sand-border bg-earth-sand-surface text-earth-soil hover:border-earth-terracotta'
                }`}
              >
                Semua Kategori (170)
              </button>
              <button
                onClick={() => setSelectedCategory('HASIL HUTAN bukan KAYU')}
                className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                  selectedCategory === 'HASIL HUTAN bukan KAYU'
                    ? 'border-earth-terracotta bg-earth-terracotta text-white'
                    : 'border-earth-sand-border bg-earth-sand-surface text-earth-soil hover:border-earth-terracotta'
                }`}
              >
                HHBK (Rp 5,85 T)
              </button>
              <button
                onClick={() => setSelectedCategory('HASIL HUTAN KAYU')}
                className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                  selectedCategory === 'HASIL HUTAN KAYU'
                    ? 'border-earth-terracotta bg-earth-terracotta text-white'
                    : 'border-earth-sand-border bg-earth-sand-surface text-earth-soil hover:border-earth-terracotta'
                }`}
              >
                Kayu / HHK (Rp 97,3 M)
              </button>
              <button
                onClick={() => setSelectedCategory('JASA LINGKUNGAN')}
                className={`px-3 py-1.5 text-xs font-bold border transition-colors ${
                  selectedCategory === 'JASA LINGKUNGAN'
                    ? 'border-earth-terracotta bg-earth-terracotta text-white'
                    : 'border-earth-sand-border bg-earth-sand-surface text-earth-soil hover:border-earth-terracotta'
                }`}
              >
                Jasling / Wisata (Rp 80,4 M)
              </button>
            </div>

            {/* Controls right: Toggle Labels & Center */}
            <div className="flex items-center space-x-2 shrink-0">
              <label className="flex items-center space-x-1.5 text-xs font-semibold text-earth-soil bg-earth-sand-surface border border-earth-sand-border px-3 py-1.5 cursor-pointer select-none hover:bg-earth-sand transition-colors">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded text-earth-forest focus:ring-earth-forest w-3.5 h-3.5 cursor-pointer"
                />
                <span>Angka di Peta</span>
              </label>

              <button
                onClick={handleResetZoom}
                className="px-3 py-1.5 text-xs font-semibold text-earth-soil bg-earth-sand-surface border border-earth-sand-border hover:bg-earth-sand flex items-center space-x-1 transition-colors"
                title="Pusatkan Peta Indonesia"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Pusatkan</span>
              </button>
            </div>
          </div>

          {/* Quick Commodity Chips & Selector */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold text-earth-soil uppercase flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Pilih Komoditas Unggulan untuk Ditampilkan di Peta:</span>
              </div>

              {/* Dropdown selector for full 170 commodities */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-earth-soil-muted font-medium">Pilihan Lengkap:</span>
                <select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value)}
                  className="text-xs font-bold bg-earth-sand-surface border border-earth-sand-border py-1.5 px-3 focus:outline-none focus:border-earth-terracotta cursor-pointer text-earth-soil"
                >
                  <option value="ALL">-- SEMUA KOMODITAS (Akumulasi) --</option>
                  {(commodityData?.top_commodities || []).map((tc) => (
                    <option key={tc.komoditas} value={tc.komoditas}>
                      {tc.komoditas} ({formatRupiahShort(tc.total_nilai)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Popular Commodity Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setSelectedCommodity('ALL')}
                className={`px-2.5 py-1 text-xs font-bold border transition-colors ${
                  selectedCommodity === 'ALL'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-earth-sand-border bg-earth-sand-surface text-earth-soil hover:border-stone-900'
                }`}
              >
                Semua Komoditas
              </button>
              {POPULAR_COMMODITY_CHIPS.map((chip) => {
                const isSelected = selectedCommodity === chip;
                return (
                  <button
                    key={chip}
                    onClick={() => setSelectedCommodity(chip)}
                    className={`px-2.5 py-1 text-xs font-bold border transition-colors flex items-center space-x-1 ${
                      isSelected
                        ? 'border-earth-terracotta bg-earth-terracotta text-white shadow-sm'
                        : 'border-earth-sand-border bg-earth-sand-surface text-earth-soil hover:border-earth-terracotta'
                    }`}
                  >
                    <span>{chip}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* WILAYAH SUB-HEADER CONTROLS (When in Wilayah Mode) */}
      {/* ========================================================================= */}
      {mapMode === 'wilayah' && (
        <section className="bg-white border-2 border-earth-sand-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-1 border border-earth-sand-border bg-earth-sand-surface p-1">
            <button
              onClick={() => setActiveMetric('nilai')}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                activeMetric === 'nilai'
                  ? 'bg-earth-terracotta text-white'
                  : 'text-earth-soil hover:text-earth-terracotta'
              }`}
            >
              Nilai Ekonomi Transaksi (Rp)
            </button>
            <button
              onClick={() => setActiveMetric('kups')}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                activeMetric === 'kups'
                  ? 'bg-earth-forest text-white'
                  : 'text-earth-soil hover:text-earth-forest'
              }`}
            >
              Populasi Unit KUPS
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1.5 text-xs font-semibold text-earth-soil bg-white border border-earth-sand-border px-3 py-1.5 cursor-pointer select-none hover:bg-earth-sand-surface transition-colors">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded text-earth-forest focus:ring-earth-forest w-3.5 h-3.5 cursor-pointer"
              />
              <span>Angka di Peta</span>
            </label>

            <button
              onClick={handleResetZoom}
              className="px-3 py-1.5 text-xs font-semibold text-earth-soil bg-white border border-earth-sand-border hover:bg-earth-sand-surface flex items-center space-x-1 transition-colors"
              title="Pusatkan Peta Indonesia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pusatkan</span>
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MAIN MAP + SIDE PANEL GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Col 8: The Leaflet Map Canvas */}
        <div className="lg:col-span-8 bg-white border-2 border-earth-sand-border flex flex-col">
          {/* Map Top Bar */}
          <div className="p-3 bg-earth-sand-surface border-b border-earth-sand-border flex items-center justify-between text-xs text-earth-soil font-mono">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 ${mapMode === 'komoditas' ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
              <span>
                {mapMode === 'komoditas' ? (
                  <>
                    Fokus Komoditas: <strong>{selectedCommodity === 'ALL' ? 'Semua Komoditas' : selectedCommodity}</strong>
                    {hoveredName && <span className="ml-2 text-earth-terracotta font-bold">&bull; {hoveredName}</span>}
                  </>
                ) : (
                  <>
                    Wilayah Dipilih: <strong>{hoveredName || selectedProvince?.name || 'Arahkan kursor / klik provinsi'}</strong>
                  </>
                )}
              </span>
            </div>

            <div className="text-[11px] text-earth-soil-muted hidden sm:flex items-center space-x-2">
              <span>{showLabels ? 'Label Angka Aktif' : 'Label Nonaktif'}</span>
              <span>&bull;</span>
              <span className="text-earth-forest font-semibold">38 Provinsi</span>
            </div>
          </div>

          {/* Leaflet Canvas */}
          <div className="relative h-[520px] sm:h-[620px] w-full bg-[#EAE4D7]">
            {(loading || loadingCommodity) && (
              <div className="absolute inset-0 bg-earth-sand/80 flex items-center justify-center z-[1000]">
                <div className="p-4 bg-white border border-earth-clay text-earth-soil text-xs font-mono flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 border-2 border-earth-terracotta border-t-transparent animate-spin"></div>
                  <span>Menyiapkan peta sebaran komoditas spasial...</span>
                </div>
              </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
          </div>

          {/* Choropleth Legend */}
          <div className="p-4 bg-earth-sand-surface border-t border-earth-sand-border">
            {mapMode === 'komoditas' ? (
              <div>
                <div className="text-xs font-bold text-earth-soil mb-2 flex items-center justify-between">
                  <span>
                    Legenda Sentra Produksi Komoditas ({selectedCommodity === 'ALL' ? 'Semua Komoditas' : selectedCommodity}):
                  </span>
                  <span className="text-[11px] text-earth-soil-muted font-normal">
                    Gradasi Terracotta (Semakin pekat = Sentra produksi utama)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 bg-[#7C2D12] border border-stone-800 shrink-0"></span>
                    <span>Sentra Utama (&gt; 50%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 bg-[#9A3412] border border-stone-800 shrink-0"></span>
                    <span>Sentra Mayor (20-50%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 bg-[#C2410C] border border-stone-800 shrink-0"></span>
                    <span>Produsen Aktif (8-20%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 bg-[#EA580C] border border-stone-800 shrink-0"></span>
                    <span>Produsen Sedang (2-8%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 bg-[#FDBA74] border border-stone-600 shrink-0"></span>
                    <span>Rintisan (&gt; 0%)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 bg-[#E7E0D3] border border-stone-400 shrink-0"></span>
                    <span>Belum Tercatat</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-earth-soil mb-2 flex items-center justify-between">
                  <span>
                    Legenda Skala {activeMetric === 'nilai' ? 'Nilai Ekonomi Transaksi (Rupiah)' : 'Populasi Unit KUPS'}:
                  </span>
                  <span className="text-[11px] text-earth-soil-muted font-normal">
                    {activeMetric === 'nilai' ? 'Gradasi Terracotta / Tanah' : 'Gradasi Forest Green / Hijau'}
                  </span>
                </div>

                {activeMetric === 'nilai' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#7C2D12] border border-stone-800 shrink-0"></span>
                      <span>&gt; Rp 1 Triliun</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#9A3412] border border-stone-800 shrink-0"></span>
                      <span>300 M - 1 T</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#C2410C] border border-stone-800 shrink-0"></span>
                      <span>100 M - 300 M</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#EA580C] border border-stone-800 shrink-0"></span>
                      <span>30 M - 100 M</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#FDBA74] border border-stone-600 shrink-0"></span>
                      <span>&gt; Rp 0</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#E7E0D3] border border-stone-400 shrink-0"></span>
                      <span>Rp 0 / Kosong</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#14532D] border border-stone-800 shrink-0"></span>
                      <span>&gt; 800 KUPS</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#166534] border border-stone-800 shrink-0"></span>
                      <span>400 - 800 KUPS</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#15803D] border border-stone-800 shrink-0"></span>
                      <span>200 - 400 KUPS</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#22C55E] border border-stone-600 shrink-0"></span>
                      <span>100 - 200 KUPS</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#86EFAC] border border-stone-600 shrink-0"></span>
                      <span>20 - 100 KUPS</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 bg-[#E7E0D3] border border-stone-400 shrink-0"></span>
                      <span>0 KUPS</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Col 4: Dynamic Side Panel Sheet */}
        <div className="lg:col-span-4 bg-white border-2 border-earth-sand-border p-5 space-y-5">
          {mapMode === 'komoditas' ? (
            /* ============================================================= */
            /* COMMODITY DETAILS PANEL */
            /* ============================================================= */
            <>
              {/* Header Box */}
              <div className="border-b border-earth-sand-border pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-earth-soil-muted bg-earth-sand-surface px-2 py-0.5 border border-earth-sand-border">
                    {commodityData?.summary.kategori || 'KATEGORI KOMODITAS'}
                  </span>
                  <span className="text-xs font-mono font-bold text-earth-forest">
                    {commodityData?.summary.provinsi_count || 0} Provinsi Sentra
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-earth-soil mt-1.5">
                  {selectedCommodity === 'ALL' ? 'Semua Komoditas Unggulan' : selectedCommodity}
                </h2>
                <p className="text-xs text-earth-soil-muted mt-1">
                  Sebaran spasial transaksi nilai ekonomi produksi perhutanan sosial nasional.
                </p>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-earth-sand-surface border border-earth-sand-border">
                  <div className="text-[10px] uppercase font-bold text-earth-soil-muted">
                    Total Nilai Ekonomi
                  </div>
                  <div className="font-mono text-base font-extrabold text-earth-terracotta mt-0.5">
                    {formatRupiah(commodityData?.summary.total_nilai || 0)}
                  </div>
                  <div className="text-[10px] text-earth-soil-muted mt-0.5">
                    Akumulasi Transaksi
                  </div>
                </div>

                <div className="p-3 bg-earth-sand-surface border border-earth-sand-border">
                  <div className="text-[10px] uppercase font-bold text-earth-soil-muted">
                    Total Transaksi
                  </div>
                  <div className="font-mono text-base font-extrabold text-earth-forest mt-0.5">
                    {formatNumber(commodityData?.summary.transaksi_count || 0)}
                  </div>
                  <div className="text-[10px] text-earth-soil-muted mt-0.5">
                    {commodityData?.summary.lembaga_count || 0} Lembaga KPS
                  </div>
                </div>
              </div>

              {/* Selected Province for this commodity */}
              {selectedProvinceCommodity && (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      <span>{selectedProvinceCommodity.provinsi}</span>
                    </span>
                    {selectedProvinceCommodity.rank > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-600 text-white font-mono">
                        SENTRA #{selectedProvinceCommodity.rank}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="font-mono text-sm font-extrabold text-amber-950">
                      {formatRupiah(selectedProvinceCommodity.total_nilai)}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-800">
                      {selectedProvinceCommodity.percentage}% Pangsa Nasional
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-900 pt-1 border-t border-amber-200 flex justify-between">
                    <span>{formatNumber(selectedProvinceCommodity.transaksi_count)} Catatan Transaksi</span>
                    <span>{selectedProvinceCommodity.lembaga_count} Lembaga Izin</span>
                  </div>
                </div>
              )}

              {/* Top 5 Producer Provinces List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-earth-soil uppercase tracking-wider flex items-center justify-between">
                  <span>Sentra Provinsi Terbesar:</span>
                  <span className="text-[10px] text-earth-soil-muted font-normal">
                    Peringkat 1 s.d. 5
                  </span>
                </div>

                <div className="divide-y divide-earth-sand-border border border-earth-sand-border bg-earth-sand-surface">
                  {(commodityData?.provinces || []).slice(0, 5).map((p) => {
                    const isSelected = selectedProvinceCommodity?.provinsi === p.provinsi;
                    return (
                      <div
                        key={p.provinsi}
                        onClick={() => handleSelectProvinceOnMap(p.provinsi)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-100 font-bold' : 'hover:bg-earth-sand'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold font-mono border ${
                            p.rank === 1 ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-earth-soil border-stone-300'
                          }`}>
                            {p.rank}
                          </span>
                          <div>
                            <div className="text-xs text-earth-soil">{p.provinsi}</div>
                            <div className="text-[10px] text-earth-soil-muted">
                              {p.transaksi_count} transaksi &bull; {p.percentage}% nasional
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs font-extrabold text-earth-forest">
                            {formatRupiahShort(p.total_nilai)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Producers (KUPS / Lembaga) */}
              <div className="space-y-2 pt-2 border-t border-earth-sand-border">
                <div className="text-xs font-bold text-earth-soil uppercase tracking-wider">
                  KUPS & Lembaga Produsen Utama:
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(commodityData?.top_producers || []).slice(0, 4).map((prod, idx) => (
                    <div key={idx} className="p-2.5 bg-earth-sand-surface border border-earth-sand-border text-xs space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="font-bold text-earth-soil line-clamp-1">
                          {prod.kups_nama || prod.nama_lembaga}
                        </div>
                        <span className="font-mono text-xs font-bold text-earth-terracotta shrink-0 ml-2">
                          {formatRupiahShort(prod.total_nilai)}
                        </span>
                      </div>
                      <div className="text-[10px] text-earth-soil-muted">
                        {prod.kabupaten}, {prod.provinsi}
                      </div>
                      {prod.produk && (
                        <div className="text-[10px] text-earth-forest font-medium">
                          Wujud Produk: {prod.produk}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ============================================================= */
            /* WILAYAH DETAILS PANEL */
            /* ============================================================= */
            <>
              {selectedProvince ? (
                <>
                  <div className="border-b border-earth-sand-border pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5 text-xs text-earth-soil-muted uppercase font-bold">
                        <MapPin className="w-4 h-4 text-earth-terracotta" />
                        <span>Profil Spasial Provinsi</span>
                      </div>
                      <button
                        onClick={() => setSelectedProvince(null)}
                        className="p-1 hover:bg-earth-sand text-earth-soil-muted hover:text-earth-soil"
                        title="Tutup lembar profil"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <h2 className="text-2xl font-extrabold text-earth-soil mt-1">
                      {selectedProvince.name}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-earth-sand-surface border border-earth-sand-border">
                      <div className="text-[10px] uppercase font-bold text-earth-soil-muted">
                        Total KUPS
                      </div>
                      <div className="font-mono text-xl font-extrabold text-earth-forest mt-0.5">
                        {formatNumber(selectedProvince.total_kups)}
                      </div>
                      <div className="text-[10px] text-earth-soil-muted mt-1">
                        {selectedProvince.total_komoditas} komoditas
                      </div>
                    </div>

                    <div className="p-3 bg-earth-sand-surface border border-earth-sand-border">
                      <div className="text-[10px] uppercase font-bold text-earth-soil-muted">
                        Nilai Ekonomi
                      </div>
                      <div className="font-mono text-base font-extrabold text-earth-terracotta mt-0.5">
                        {formatRupiah(selectedProvince.total_nilai_ekonomi)}
                      </div>
                      <div className="text-[10px] text-earth-soil-muted mt-1">
                        Tercatat di Sistem
                      </div>
                    </div>
                  </div>

                  {/* Tier Distribution in Province */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-earth-soil uppercase tracking-wider flex items-center justify-between">
                      <span>Komposisi Kelas KUPS:</span>
                      <span className="font-mono text-[11px] text-earth-soil-muted">
                        {selectedProvince.total_kups} Unit
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                      <div className="p-2 bg-blue-50 border border-blue-300">
                        <span className="text-[10px] font-bold text-blue-900 block">BIRU</span>
                        <span className="font-mono font-extrabold text-blue-950">
                          {selectedProvince.count_biru}
                        </span>
                      </div>
                      <div className="p-2 bg-stone-100 border border-stone-400">
                        <span className="text-[10px] font-bold text-stone-900 block">PERAK</span>
                        <span className="font-mono font-extrabold text-stone-950">
                          {selectedProvince.count_perak}
                        </span>
                      </div>
                      <div className="p-2 bg-amber-50 border border-amber-400">
                        <span className="text-[10px] font-bold text-amber-900 block">EMAS</span>
                        <span className="font-mono font-extrabold text-amber-950">
                          {selectedProvince.count_emas}
                        </span>
                      </div>
                      <div className="p-2 bg-emerald-50 border border-emerald-500">
                        <span className="text-[10px] font-bold text-emerald-900 block">PLATINUM</span>
                        <span className="font-mono font-extrabold text-emerald-950">
                          {selectedProvince.count_platinum}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Commodities in Province */}
                  <div className="space-y-2 pt-2 border-t border-earth-sand-border">
                    <div className="text-xs font-bold text-earth-soil uppercase tracking-wider">
                      Komoditas Utama di {selectedProvince.name}:
                    </div>
                    {selectedProvince.top_commodities && selectedProvince.top_commodities.length > 0 ? (
                      <div className="divide-y divide-earth-sand-border border border-earth-sand-border bg-earth-sand-surface">
                        {selectedProvince.top_commodities.slice(0, 5).map((tc, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-earth-soil">{tc.komoditas}</div>
                              <div className="text-[10px] text-earth-soil-muted uppercase">{tc.kategori}</div>
                            </div>
                            <div className="font-mono font-bold text-earth-forest text-right">
                              {formatRupiah(tc.total_nilai)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-earth-sand-surface border border-earth-sand-border text-xs text-earth-soil-muted italic">
                        Belum ada komoditas dengan pencatatan nilai transaksi untuk provinsi ini.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-xs text-earth-soil-muted">
                  <Info className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="font-bold">Belum Ada Provinsi Terpilih</p>
                  <p className="mt-1">Klik salah satu wilayah pada peta untuk memeriksa rincian komoditas dan sebaran kelas.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM LEADERBOARD: TOP 12 KOMODITAS NASIONAL */}
      {/* ========================================================================= */}
      <section className="bg-white border-2 border-earth-sand-border p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-earth-sand-border">
          <div>
            <h3 className="text-lg font-bold text-earth-soil flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-earth-forest" />
              <span>Daftar 12 Komoditas Unggulan Terbesar Nasional</span>
            </h3>
            <p className="text-xs text-earth-soil-muted mt-0.5">
              Klik nama komoditas untuk langsung memvisualisasikan peta sebaran spasialnya di seluruh provinsi.
            </p>
          </div>
          <span className="text-xs text-earth-soil-muted font-mono">
            Total 170 Komoditas Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(commodityData?.top_commodities || []).slice(0, 12).map((item, idx) => {
            const isCurrent = selectedCommodity === item.komoditas;
            return (
              <div
                key={item.komoditas}
                onClick={() => {
                  setSelectedCommodity(item.komoditas);
                  setMapMode('komoditas');
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`p-3.5 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-earth-terracotta bg-amber-50 ring-2 ring-earth-terracotta/20'
                    : 'border-earth-sand-border bg-earth-sand-surface hover:border-earth-terracotta hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 bg-stone-200 text-stone-800 text-[10px] font-mono font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-earth-soil line-clamp-1">
                      {item.komoditas}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-earth-sand border border-earth-sand-border text-earth-soil-muted font-mono">
                    {item.kategori_komoditas === 'HASIL HUTAN bukan KAYU' ? 'HHBK' : item.kategori_komoditas === 'HASIL HUTAN KAYU' ? 'HHK' : 'JASLING'}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-earth-sand-border flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] text-earth-soil-muted">Nilai Transaksi:</div>
                    <div className="font-mono text-sm font-extrabold text-earth-forest">
                      {formatRupiah(item.total_nilai)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-earth-soil-muted">Sebaran:</div>
                    <div className="font-mono text-xs font-bold text-earth-soil">
                      {item.provinsi_count} Provinsi
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
