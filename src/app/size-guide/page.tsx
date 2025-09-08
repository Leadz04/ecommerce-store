'use client';

import { useState } from 'react';

export default function SizeGuidePage() {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  const convert = (valCm: number) => (unit === 'cm' ? valCm : +(valCm / 2.54).toFixed(1));

  const tops = [
    { size: 'XS', chest: 84, waist: 68 },
    { size: 'S', chest: 90, waist: 74 },
    { size: 'M', chest: 96, waist: 80 },
    { size: 'L', chest: 102, waist: 86 },
    { size: 'XL', chest: 108, waist: 92 },
  ];

  const bottoms = [
    { size: '28', waist: 71, hip: 88 },
    { size: '30', waist: 76, hip: 93 },
    { size: '32', waist: 81, hip: 98 },
    { size: '34', waist: 86, hip: 103 },
    { size: '36', waist: 91, hip: 108 },
  ];

  const shoe = [
    { eu: 39, uk: 6, us: 7, foot: 25 },
    { eu: 40, uk: 6.5, us: 7.5, foot: 25.5 },
    { eu: 41, uk: 7, us: 8, foot: 26 },
    { eu: 42, uk: 8, us: 9, foot: 26.8 },
    { eu: 43, uk: 9, us: 10, foot: 27.6 },
    { eu: 44, uk: 9.5, us: 10.5, foot: 28 },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Size Guide</h1>
          <p className="text-blue-100 text-lg">International conversions and body measurement rules</p>
        </div>
      </section>

      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Unit Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-gray-600">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                Current unit: {unit.toUpperCase()}
              </span>
            </div>
            <div className="inline-flex items-center border rounded-full overflow-hidden bg-white shadow-sm">
              <button onClick={() => setUnit('cm')} className={`px-4 py-2 text-sm transition-colors ${unit === 'cm' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Centimeters</button>
              <button onClick={() => setUnit('in')} className={`px-4 py-2 text-sm transition-colors ${unit === 'in' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Inches</button>
            </div>
          </div>

          {/* Tops */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tops (Men & Women)</h2>
              <span className="text-xs text-gray-500">Body measurements • Regular fit</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Chest ({unit})</th>
                    <th className="px-4 py-3 font-semibold">Waist ({unit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tops.map((r, i) => (
                    <tr key={r.size} className={i % 2 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.size}</td>
                      <td className="px-4 py-3 text-gray-800">{convert(r.chest)}</td>
                      <td className="px-4 py-3 text-gray-800">{convert(r.waist)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottoms */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Bottoms (Jeans & Trousers)</h2>
              <span className="text-xs text-gray-500">Conversion approximations</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Label</th>
                    <th className="px-4 py-3 font-semibold">Waist ({unit})</th>
                    <th className="px-4 py-3 font-semibold">Hip ({unit})</th>
                    <th className="px-4 py-3 font-semibold">US</th>
                    <th className="px-4 py-3 font-semibold">UK</th>
                    <th className="px-4 py-3 font-semibold">EU</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bottoms.map((r, i) => (
                    <tr key={r.size} className={i % 2 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.size}</td>
                      <td className="px-4 py-3 text-gray-800">{convert(r.waist)}</td>
                      <td className="px-4 py-3 text-gray-800">{convert(r.hip)}</td>
                      <td className="px-4 py-3 text-gray-800">{Number(r.size)}</td>
                      <td className="px-4 py-3 text-gray-800">{Number(r.size) - 2}</td>
                      <td className="px-4 py-3 text-gray-800">{Number(r.size) + 10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shoes */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Shoes (International)</h2>
              <span className="text-xs text-gray-500">Measure both feet • Use larger value</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">EU</th>
                    <th className="px-4 py-3 font-semibold">UK</th>
                    <th className="px-4 py-3 font-semibold">US</th>
                    <th className="px-4 py-3 font-semibold">Foot length ({unit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shoe.map((r, i) => (
                    <tr key={r.eu} className={i % 2 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.eu}</td>
                      <td className="px-4 py-3 text-gray-800">{r.uk}</td>
                      <td className="px-4 py-3 text-gray-800">{r.us}</td>
                      <td className="px-4 py-3 text-gray-800">{convert(r.foot)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* How to Measure */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Measure</h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>
                <span className="font-medium">Chest:</span> Measure around the fullest part of your chest, keeping the tape horizontal.
              </li>
              <li>
                <span className="font-medium">Waist:</span> Measure around the narrowest part of the waist. Do not hold your breath.
              </li>
              <li>
                <span className="font-medium">Hips:</span> Measure around the widest part of your hips and buttocks.
              </li>
              <li>
                <span className="font-medium">Inseam:</span> Measure from the top of your inner thigh down to the ankle bone.
              </li>
              <li>
                <span className="font-medium">Foot length:</span> Place your foot on paper, mark heel to longest toe, measure the distance.
              </li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">Note: Conversions are approximate and may vary slightly by brand and fit.</p>
          </div>
        </div>
      </section>
    </div>
  );
}


