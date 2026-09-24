import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { fetchMapGeoJson } from '../api';
import { TierBadge } from '../components/TierBadge';
import { 
  MapPin, 
  Layers, 
  Banknote, 
  Sprout, 
  Info, 
  X, 
  Filter, 
  Maximize2,
  Building2
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

export const PetaSebaranView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<'nilai' | 'kups'>('nilai');
  const [selectedProvince, setSelectedProvince] = useState<SelectedProvince | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
  const formatRupiah = (val: number) => {
    if (!val) return 'Rp 0';
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(2)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Color scales flat earth tones
  const getColor = (val: number, metric: 'nilai' | 'kups') => {
    if (metric === 'nilai') {
      // Nilai Ekonomi: Terracotta / Ochre earth tones
      if (val > 1_000_000_000_000) return '#7C2D12'; // > 1 T (deep rust soil)
      if (val > 300_000_000_000) return '#9A3412';   // 300M - 1T (burnt clay)
      if (val > 100_000_000_000) return '#C2410C';   // 100M - 300M (terracotta)
      if (val > 30_000_000_000) return '#EA580C';    // 30M - 100M (warm terracotta)
      if (val > 5_000_000_000) return '#F97316';     // 5M - 30M (ochre amber)
      if (val > 0) return '#FDBA74';                 // > 0 (light ochre)
      return '#E7E0D3';                             // 0 / data kosong (sand surface)
    } else {
      // Kepadatan KUPS: Forest Green earth tones
      if (val > 800) return '#14532D'; // > 800 (deep pine forest)
      if (val > 400) return '#166534'; // 400 - 800 (forest green)
      if (val > 200) return '#15803D'; // 200 - 400 (moss green)
      if (val > 100) return '#22C55E'; // 100 - 200 (light leaf)
      if (val > 20) return '#86EFAC';  // 20 - 100 (pale leaf)
      if (val > 0) return '#BBF7D0';   // > 0 (sprout tint)
      return '#E7E0D3';                // 0 (sand surface)
    }
  };

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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !geoData || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-1.2, 118.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 9,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Render GeoJSON
    renderChoropleth(map, geoData, activeMetric);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [geoData]);

  // Update styles when activeMetric changes
  useEffect(() => {
    if (mapInstanceRef.current && geoData && geojsonLayerRef.current) {
      geojsonLayerRef.current.eachLayer((layer: any) => {
        const props = layer.feature.properties;
        const val = activeMetric === 'nilai' ? (props.total_nilai_ekonomi || 0) : (props.total_kups || 0);
        layer.setStyle({
          fillColor: getColor(val, activeMetric),
          fillOpacity: 0.9,
          color: '#1F1E1B',
          weight: 1,
        });
      });
    }
  }, [activeMetric]);

  const renderChoropleth = (map: L.Map, data: any, metric: 'nilai' | 'kups') => {
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const layer = L.geoJSON(data, {
      style: (feature) => {
        const props = feature?.properties || {};
        const val = metric === 'nilai' ? (props.total_nilai_ekonomi || 0) : (props.total_kups || 0);
        return {
          fillColor: getColor(val, metric),
          weight: 1,
          opacity: 1,
          color: '#2C2825',
          fillOpacity: 0.9,
        };
      },
      onEachFeature: (feature, l) => {
        const props = feature.properties || {};
        const provName = props.PROVINSI || props.provinsi || 'Wilayah';

        l.on({
          mouseover: (e) => {
            const currentLayer = e.target;
            currentLayer.setStyle({
              weight: 2.5,
              color: '#000000',
              fillOpacity: 1,
            });
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

    // Pick initial province as preview (e.g. Jawa Timur or first with high value)
    const jabar = data.features?.find((f: any) => f.properties?.PROVINSI?.includes('Jawa Timur') || f.properties?.total_nilai_ekonomi > 1_000_000_000_000);
    if (jabar && !selectedProvince) {
      const p = jabar.properties;
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      {/* View Header */}
      <div className="bg-white border-2 border-earth-sand-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-earth-soil flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-earth-forest" />
            <span>Peta Choropleth Sebaran Komoditas & Nilai Ekonomi KUPS</span>
          </h1>
          <p className="text-xs text-earth-soil-muted mt-1">
            Visualisasi spasial batas 38 provinsi Indonesia. Klik provinsi untuk membuka lembar profil wilayah.
          </p>
        </div>

        {/* Metric Switcher Flat */}
        <div className="flex items-center space-x-2 border border-earth-sand-border bg-earth-sand-surface p-1">
          <button
            onClick={() => setActiveMetric('nilai')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
              activeMetric === 'nilai'
                ? 'bg-earth-terracotta text-white'
                : 'text-earth-soil hover:text-earth-terracotta'
            }`}
          >
            Nilai Ekonomi (Rp)
          </button>
          <button
            onClick={() => setActiveMetric('kups')}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
              activeMetric === 'kups'
                ? 'bg-earth-forest text-white'
                : 'text-earth-soil hover:text-earth-forest'
            }`}
          >
            Kepadatan KUPS
          </button>
        </div>
      </div>

      {/* Main Map + Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container (col 8) */}
        <div className="lg:col-span-8 bg-white border-2 border-earth-sand-border flex flex-col">
          {/* Map Top Bar */}
          <div className="p-3 bg-earth-sand-surface border-b border-earth-sand-border flex items-center justify-between text-xs text-earth-soil font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-600"></span>
              <span>
                Wilayah Dipilih: <strong>{hoveredName || selectedProvince?.name || 'Arahkan kursor / klik provinsi'}</strong>
              </span>
            </div>
            <span className="text-[11px] text-earth-soil-muted hidden sm:inline">
              Mode: {activeMetric === 'nilai' ? 'Gradasi Nilai Ekonomi' : 'Gradasi Jumlah Unit KUPS'}
            </span>
          </div>

          {/* Leaflet Container */}
          <div className="relative h-[480px] sm:h-[560px] w-full bg-[#EAE4D7]">
            {loading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80">
                <span className="font-mono text-xs text-earth-clay p-3 border border-earth-clay bg-white">
                  Memuat geometri batas 38 provinsi dan data transaksi...
                </span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-red-50 p-4">
                <span className="text-red-700 text-xs font-bold">{error}</span>
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* Choropleth Legend Flat */}
          <div className="p-4 bg-earth-sand-surface border-t border-earth-sand-border">
            <div className="text-[11px] font-bold text-earth-soil uppercase tracking-wider mb-2">
              Legenda Gradasi: {activeMetric === 'nilai' ? 'Nilai Transaksi Tercatat (Rupiah)' : 'Populasi KUPS Terdata (Unit)'}
            </div>
            {activeMetric === 'nilai' ? (
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#E7E0D3] border border-stone-400"></span>
                  <span className="text-[10px]">0 / Kosong</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#FDBA74] border border-stone-400"></span>
                  <span className="text-[10px]">&lt; 5M</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#EA580C] border border-stone-400"></span>
                  <span className="text-[10px]">30M - 100M</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#C2410C] border border-stone-400"></span>
                  <span className="text-[10px]">100M - 300M</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#9A3412] border border-stone-400"></span>
                  <span className="text-[10px]">300M - 1T</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#7C2D12] border border-stone-400"></span>
                  <span className="text-[10px] font-bold text-white bg-[#7C2D12] px-1">&gt; 1 Triliun</span>
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#E7E0D3] border border-stone-400"></span>
                  <span className="text-[10px]">0</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#BBF7D0] border border-stone-400"></span>
                  <span className="text-[10px]">1 - 20</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#86EFAC] border border-stone-400"></span>
                  <span className="text-[10px]">20 - 100</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#22C55E] border border-stone-400"></span>
                  <span className="text-[10px]">100 - 200</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#166534] border border-stone-400"></span>
                  <span className="text-[10px]">400 - 800</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 bg-[#14532D] border border-stone-400"></span>
                  <span className="text-[10px] font-bold text-white bg-[#14532D] px-1">&gt; 800 KUPS</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Province Detail Profile (col 4) */}
        <div className="lg:col-span-4 bg-white border-2 border-earth-sand-border p-5 space-y-5">
          {selectedProvince ? (
            <>
              {/* Header Box */}
              <div className="pb-3 border-b-2 border-earth-terracotta">
                <span className="text-[10px] uppercase font-bold text-earth-soil-muted tracking-wider">
                  PROFIL WILAYAH PROVINSI
                </span>
                <h3 className="text-xl font-extrabold text-earth-soil uppercase">
                  {selectedProvince.name}
                </h3>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-earth-sand-surface border border-earth-sand-border">
                  <span className="text-[10px] uppercase font-bold text-earth-soil-muted block">
                    TOTAL KUPS
                  </span>
                  <div className="text-2xl font-mono font-extrabold text-earth-soil mt-1">
                    {formatNumber(selectedProvince.total_kups)}
                  </div>
                  <span className="text-[10px] text-earth-soil-muted">Unit Usaha</span>
                </div>

                <div className="p-3 bg-earth-sand-surface border border-earth-sand-border">
                  <span className="text-[10px] uppercase font-bold text-earth-soil-muted block">
                    NILAI EKONOMI
                  </span>
                  <div className="text-lg font-mono font-extrabold text-earth-terracotta mt-1">
                    {formatRupiah(selectedProvince.total_nilai_ekonomi)}
                  </div>
                  <span className="text-[10px] text-earth-soil-muted">Transaksi GoKUPS</span>
                </div>
              </div>

              {/* 4-Tier Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-earth-soil uppercase tracking-wider flex items-center justify-between">
                  <span>Komposisi Kelas KUPS:</span>
                  <span className="font-mono text-earth-soil-muted">
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
                    Belum ada komoditas dengan pencatatan nilai transaksi di GoKUPS untuk provinsi ini.
                  </div>
                )}
              </div>

              {/* Explanatory note */}
              <div className="p-3 bg-earth-forest-tint border border-earth-forest text-[11px] text-earth-forest-dark leading-relaxed">
                <strong>Catatan Agregat:</strong> KUPS di {selectedProvince.name} didorong melengkapi 
                checklist GoKUPS untuk mengajukan peningkatan kelas dari Perak ke Emas.
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-earth-soil-muted">
              <Info className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="font-bold">Belum Ada Provinsi Terpilih</p>
              <p className="mt-1">Klik salah satu wilayah pada peta untuk memeriksa rincian komoditas dan sebaran kelas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
