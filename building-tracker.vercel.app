import React, { useState, useEffect } from 'react';

// Standard apartment numbers template for 16-apt floors
const createFloorApts = (prefix) => {
  const p = prefix === 0 ? '0' : prefix.toString();
  return {
    block1: { right: [`${p}01`, `${p}02`], left: [`${p}16`, `${p}15`] },
    block2: { right: [`${p}03`, `${p}04`], left: [`${p}14`, `${p}13`] },
    block3: { right: [`${p}05`, `${p}06`], left: [`${p}12`, `${p}11`] },
    block4: { right: [`${p}07`, `${p}08`], left: [`${p}10`, `${p}09`] },
  };
};

const INITIAL_BUILDING_STRUCTURE = {
  Roof: {
    block1: { right: [], left: [] },
    block2: { right: [], left: ['414', '413'] },
    block3: { right: [], left: ['412', '411'] },
    block4: { right: [], left: [] },
  },
  '3rd Floor': createFloorApts(3),
  '2nd Floor': createFloorApts(2),
  '1st Floor': createFloorApts(1),
  Ground: {
    ...createFloorApts(0),
    // Ground floor North Left block has no 016 (Main Gate)
    block1: { right: ['001', '002'], left: ['015'] },
  },
};

export default function BuildingTracker() {
  const [activeFloor, setActiveFloor] = useState('1st Floor');
  const [apartmentData, setApartmentData] = useState({});
  const [selectedApt, setSelectedApt] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  // Form State for Modal
  const [formData, setFormData] = useState({
    residentName: '',
    residentPhone: '',
    ownerName: '',
    isRented: false,
    hasPaid: false,
  });

  // Load saved data from localStorage or initialize defaults
  useEffect(() => {
    const saved = localStorage.getItem('building_payment_data');
    if (saved) {
      setApartmentData(JSON.parse(saved));
    } else {
      const initialData = {};
      const allApts = ['411', '412', '413', '414'];
      // Ground (001-015)
      for (let i = 1; i <= 15; i++) initialData[`0${i < 10 ? '0' + i : i}`] = getDefaultAptObj();
      // Floors 1 to 3 (101-116, 201-216, 301-316)
      [1, 2, 3].forEach(f => {
        for (let i = 1; i <= 16; i++) {
          const num = `${f}${i < 10 ? '0' + i : i}`;
          initialData[num] = getDefaultAptObj();
        }
      });
      allApts.forEach(num => { initialData[num] = getDefaultAptObj(); });
      setApartmentData(initialData);
    }
  }, []);

  function getDefaultAptObj() {
    return { residentName: '', residentPhone: '', ownerName: '', isRented: false, hasPaid: false };
  }

  const saveData = (updated) => {
    setApartmentData(updated);
    localStorage.setItem('building_payment_data', JSON.stringify(updated));
  };

  // Stats calculation
  const totalApts = Object.keys(apartmentData).length;
  const paidCount = Object.values(apartmentData).filter(a => a.hasPaid).length;
  const totalCollected = paidCount * 2000;
  const targetAmount = totalApts * 2000;

  const openAptModal = (aptNum) => {
    setSelectedApt(aptNum);
    const data = apartmentData[aptNum] || getDefaultAptObj();
    setFormData(data);
  };

  const handleFormSave = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const updated = { ...apartmentData, [selectedApt]: formData };
    saveData(updated);
    setSelectedApt(null);
  };

  const verifyAdmin = (e) => {
    e.preventDefault();
    if (adminPin === '1234') { // Default PIN for demo
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPin('');
    } else {
      alert('Incorrect PIN (Default demo PIN is 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Building Maintenance Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">67 Apartments • 2,000 LE Maintenance Fee</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminModal(true)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              isAdmin ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {isAdmin ? 'Admin Mode (Active)' : 'Manager Login'}
          </button>
        </div>
      </header>

      {/* Stats Summary Bar */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Collected</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalCollected.toLocaleString()} LE</div>
          <div className="text-xs text-slate-500 mt-1">Target: {targetAmount.toLocaleString()} LE</div>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Payment Progress</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{paidCount} / {totalApts} Apts</div>
          <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(paidCount/totalApts)*100}%` }}></div>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Unpaid Remaining</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{(totalApts - paidCount) * 2000} LE</div>
          <div className="text-xs text-slate-500 mt-1">{totalApts - paidCount} apartments pending</div>
        </div>
      </div>

      {/* Floor Selection Tabs */}
      <div className="max-w-5xl mx-auto flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
        {Object.keys(INITIAL_BUILDING_STRUCTURE).map((floor) => (
          <button
            key={floor}
            onClick={() => setActiveFloor(floor)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeFloor === floor
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {floor}
          </button>
        ))}
      </div>

      {/* 4-Block Visual Floor Plan */}
      <div className="max-w-3xl mx-auto bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
        <div className="text-center text-xs font-bold text-slate-500 tracking-widest uppercase mb-2">
          {activeFloor} Floor Plan
        </div>

        {['block1', 'block2', 'block3', 'block4'].map((blockKey, idx) => {
          const blockNames = ['North Block (Top)', '2nd Block', '3rd Block', 'South Block (Bottom)'];
          const block = INITIAL_BUILDING_STRUCTURE[activeFloor][blockKey];
          const hasLeft = block.left.length > 0;
          const hasRight = block.right.length > 0;

          if (!hasLeft && !hasRight) return null;

          return (
            <div key={blockKey} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all">
              <div className="text-xs font-semibold text-slate-400 mb-3 text-center">{blockNames[idx]}</div>

              <div className="grid grid-cols-2 gap-8 items-center">
                {/* Left Side (Ascending / Northbound) */}
                <div className="space-y-2">
                  {block.left.map((aptNum) => {
                    const isPaid = apartmentData[aptNum]?.hasPaid;
                    return (
                      <button
                        key={aptNum}
                        onClick={() => openAptModal(aptNum)}
                        className={`w-full p-3 rounded-xl border font-bold text-sm flex justify-between items-center transition-all shadow-md ${
                          isPaid
                            ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/50'
                            : 'bg-rose-950/40 border-rose-600/60 text-rose-300 hover:bg-rose-900/50'
                        }`}
                      >
                        <span>Apt {aptNum}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </button>
                    );
                  })}
                  {activeFloor === 'Ground' && blockKey === 'block1' && (
                    <div className="p-3 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl text-center text-xs font-bold text-slate-500">
                      🚪 Building Gate (No 016)
                    </div>
                  )}
                </div>

                {/* Right Side (Descending / Southbound) */}
                <div className="space-y-2">
                  {block.right.map((aptNum) => {
                    const isPaid = apartmentData[aptNum]?.hasPaid;
                    return (
                      <button
                        key={aptNum}
                        onClick={() => openAptModal(aptNum)}
                        className={`w-full p-3 rounded-xl border font-bold text-sm flex justify-between items-center transition-all shadow-md ${
                          isPaid
                            ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/50'
                            : 'bg-rose-950/40 border-rose-600/60 text-rose-300 hover:bg-rose-900/50'
                        }`}
                      >
                        <span>Apt {aptNum}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Apartment Info & Payment Toggle */}
      {selectedApt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Apartment {selectedApt} Details</h2>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Resident Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.residentName}
                  onChange={(e) => setFormData({ ...formData, residentName: e.target.value })}
                  placeholder={isAdmin ? "Enter resident name" : "Not specified"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Resident Phone</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.residentPhone}
                  onChange={(e) => setFormData({ ...formData, residentPhone: e.target.value })}
                  placeholder={isAdmin ? "010xxxxxxxx" : "Not specified"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Owner Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder={isAdmin ? "Enter owner name" : "Not specified"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-700">
                <span className="text-sm font-medium">Is Rented?</span>
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={formData.isRented}
                  onChange={(e) => setFormData({ ...formData, isRented: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer disabled:opacity-60"
                />
              </div>

              <div className={`flex items-center justify-between p-4 rounded-xl border ${formData.hasPaid ? 'bg-emerald-950/40 border-emerald-600/60' : 'bg-rose-950/40 border-rose-600/60'}`}>
                <div>
                  <div className="font-bold text-sm">2,000 LE Maintenance Fee</div>
                  <div className="text-xs text-slate-400">{formData.hasPaid ? 'Payment Received' : 'Pending Payment'}</div>
                </div>
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={formData.hasPaid}
                  onChange={(e) => setFormData({ ...formData, hasPaid: e.target.checked })}
                  className="w-6 h-6 accent-emerald-500 rounded cursor-pointer disabled:opacity-60"
                />
              </div>

              {!isAdmin && (
                <div className="text-center text-xs text-slate-500 italic mt-2">
                  Read-only mode. Switch to Admin mode to edit resident info and payment status.
                </div>
              )}

              {isAdmin && (
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30"
                >
                  Save Changes
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Admin Passcode Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-xs rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Manager Access</h3>
            <p className="text-xs text-slate-400 mb-4">Enter PIN code to edit (Default: 1234)</p>
            <form onSubmit={verifyAdmin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="****"
                className="w-full text-center tracking-widest text-xl bg-slate-900 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="w-1/2 bg-slate-700 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-blue-600 py-2.5 rounded-xl text-sm font-semibold text-white"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}