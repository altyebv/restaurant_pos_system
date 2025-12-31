import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { HiClock, HiUser } from 'react-icons/hi';
import { getCurrentSession, openSession, closeSession } from '../../https';
import { AiOutlineClockCircle, AiOutlineDollar } from 'react-icons/ai';

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '00:00:00';
  const sec = Math.floor(ms / 1000);
  const hours = Math.floor(sec / 3600).toString().padStart(2, '0');
  const min = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${hours}:${min}:${s}`;
};

const currency = (v) => `$${Number(v || 0).toFixed(2)}`;

const SessionBanner = () => {
  const user = useSelector((s) => s.user);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCurrentSession();
      const s = res?.data?.data || null;
      setSession(s);
    } catch (err) {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // poll every 5 seconds for updated totals
    const poll = setInterval(() => void load(), 5000);
    // update local clock every 1s
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(timerRef.current);
    };
  }, []);

  const handleOpenSession = async () => {
    try {
      const res = await openSession({ startingBalance: 0 });
      setSession(res?.data?.data);
    } catch (err) {
      console.warn('Failed to open session', err);
    }
  };

  const handleCloseSession = async () => {
    try {
      if (!session?._id) return;
      const res = await closeSession({ sessionId: session._id });
      setSession(res?.data?.data);
      // If closed, reload once to ensure new data
      void load();
    } catch (err) {
      console.warn('Failed to close session', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg p-3 flex gap-4 items-center">
        <div className="text-sm">Loading session...</div>
      </div>
    );
  }

  const isOpen = !!(session && session.status === 'open');
  const startDate = session?.startedAt ? new Date(session.startedAt).getTime() : null;
  const elapsed = startDate ? now - startDate : 0;
  const startingBalance = Number(session?.startingBalance) || 0;
  const totalCash = Number(session?.totalCashCollected) || Number(session?.totalSales) || 0;
  const totalExpenses = Number(session?.totalExpenses) || 0;
  const balance = startingBalance + totalCash - totalExpenses;
  const totalOrders = Number(session?.totalOrders) || (session?.orders?.length || 0);

  return (
    <div className="bg-gradient-to-r from-[#111827] to-[#0f172a] border border-gray-700 rounded-lg px-4 py-3 flex items-center gap-4">
      <div className="flex items-center gap-3">
        <HiUser className="text-gray-400" />
        <div className="text-sm text-white font-medium">{user?.name || '—'}</div>
      </div>

      <div className="flex items-center gap-3">
        <HiClock className="text-gray-400" />
        <div className="text-sm text-gray-300">{isOpen ? formatDuration(elapsed) : 'No active shift'}</div>
      </div>

      <div className="flex items-center gap-3">
        <AiOutlineDollar className="text-gray-400" />
        <div className="text-sm text-gray-300">Sales: <span className="text-white font-semibold ml-2">{currency(Number(session?.totalSales || session?.computedSales || 0))}</span></div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-400">Orders</div>
        <div className="text-sm text-white font-semibold">{totalOrders}</div>
      </div>

      <div className="ml-auto flex gap-2">
        {!isOpen ? (
          <button onClick={handleOpenSession} className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white">Open Shift</button>
        ) : (
          <button onClick={handleCloseSession} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Close Shift</button>
        )}
      </div>
    </div>
  );
};

export default SessionBanner;
