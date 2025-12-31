import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { getCurrentSession, closeSession, logout } from '../../https';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { removeUser } from '../../redux/slices/userSlice';
import { useNavigate } from 'react-router-dom';

const currency = (v) => `${Number(v || 0).toFixed(2)}`;

const SessionCloseModal = ({ isOpen, onClose, onAfterClose }) => {
  const [prevDir, setPrevDir] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const prev = document.documentElement.getAttribute('dir') || '';
      setPrevDir(prev);
      document.documentElement.setAttribute('dir', 'rtl');
    } else if (prevDir !== null) {
      document.documentElement.setAttribute('dir', prevDir || 'ltr');
      setPrevDir(null);
    }
    return () => {
      if (prevDir !== null) {
        document.documentElement.setAttribute('dir', prevDir || 'ltr');
      }
    };
  }, [isOpen]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [newExpenses, setNewExpenses] = useState([]);
  const [comment, setComment] = useState('');
  const [manualCash, setManualCash] = useState(null);

  const { data: currentSessionRes, refetch } = useQuery({
    queryKey: ['currentSession'],
    queryFn: () => getCurrentSession(),
    enabled: isOpen, // only fetch when modal is opened
    refetchOnWindowFocus: false,
  });

  const session = currentSessionRes?.data?.data || null;
  const startingBalance = Number(session?.startingBalance) || 0;
  const computedSales = Number(session?.computedSales || session?.totalSales || 0);
  const computedCash = Number(session?.computedCashCollected || session?.totalCashCollected || 0);
  const existingExpenses = Array.isArray(session?.expenses) ? session.expenses : [];
  const existingExpensesTotal = existingExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const newExpensesTotal = newExpenses.reduce((s, e) => s + (Number(e.amount || 0) || 0), 0);
  const totalExpenses = existingExpensesTotal + newExpensesTotal;
  const totalCashCollected = manualCash !== null ? Number(manualCash) : computedCash;
  const endBalance = startingBalance + Number(totalCashCollected || 0) - totalExpenses;

  useEffect(() => {
    if (!isOpen) {
      setNewExpenses([]);
      setComment('');
      setManualCash(null);
    }
  }, [isOpen]);

  const addExpenseRow = () => {
    setNewExpenses(prev => [...prev, { amount: '', description: '' }]);
  };

  const updateExpense = (index, key, value) => {
    setNewExpenses(prev => prev.map((e, i) => i === index ? { ...e, [key]: value } : e));
  };

  const removeExpenseRow = (index) => {
    setNewExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const closeMutation = useMutation({
    mutationFn: (payload) => closeSession(payload),
    onSuccess: (res) => {
      // After closing session, optionally logout (onAfterClose will call logout)
      refetch();
      onAfterClose?.();
    },
    onError: (err) => {
      console.error('Failed to close session', err);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      dispatch(removeUser());
      navigate('/auth');
    },
    onError: (err) => console.error('Logout failed', err)
  });

  const handleCloseAndLogout = async () => {
    if (!session?._id) {
      // just logout
      logoutMutation.mutate();
      return;
    }
    const payload = {
      sessionId: session._id,
      expenses: newExpenses.filter(e => Number(e.amount) > 0).map(e => ({ amount: Number(e.amount), description: e.description })),
      totalCashCollected: typeof manualCash === 'number' ? Number(manualCash) : undefined,
      comment: comment || undefined,
    };
    closeMutation.mutate(payload, {
      onSuccess: () => logoutMutation.mutate(),
    });
  };

  const handleLogoutWithoutClosing = () => {
    logoutMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={'تسجيل الخروج وإغلاق الجلسة'}>
      <div className="space-y-4">
        {!session ? (
          <div className="text-sm text-gray-300">لا توجد جلسة مفتوحة. يمكنك تسجيل الخروج بأمان.</div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm text-gray-300">الرصيد الافتتاحي</div>
              <div className="text-sm text-white">{currency(startingBalance)}</div>

              <div className="text-sm text-gray-300">إجمالي المبيعات</div>
              <div className="text-sm text-white">{currency(computedSales)}</div>

              <div className="text-sm text-gray-300">إجمالي النقد المُجمع</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={manualCash === null ? computedCash : manualCash}
                  onChange={(e) => setManualCash(e.target.value === '' ? null : Number(e.target.value))}
                  className="bg-[#111827] border border-gray-600 p-2 rounded text-white outline-none w-full"
                />
              </div>

              {/* <div className="text-sm text-gray-300">Existing Expenses</div> */}
              {/* <div className="text-sm text-white">{currency(existingExpensesTotal)}</div> */}

              <div className="text-sm text-gray-300">المنصرفات</div>
              <div className="text-sm text-white">{currency(newExpensesTotal)}</div>

              {/* <div className="text-sm text-gray-300">Total Expenses</div> */}
              {/* <div className="text-sm text-white">{currency(totalExpenses)}</div> */}

              <div className="text-sm text-gray-300">الرصيد النهائي</div>
              <div className="text-sm text-white">{currency(endBalance)}</div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-300 font-semibold">إضافة منصرفات</div>
              <div className="space-y-2 mt-2">
                {newExpenses.map((exp, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="number" className="bg-[#111827] border border-gray-600 p-2 rounded text-white w-32" placeholder="0.00" value={exp.amount} onChange={(e) => updateExpense(idx, 'amount', e.target.value)} />
                    <input type="text" className="bg-[#111827] border border-gray-600 p-2 rounded text-white flex-1" placeholder="الوصف" value={exp.description} onChange={(e) => updateExpense(idx, 'description', e.target.value)} />
                    <button className="bg-red-500 px-3 rounded text-white" type="button" onClick={() => removeExpenseRow(idx)}>إزالة</button>
                  </div>
                ))}
                <div>
                  <button className="bg-green-500 px-3 py-1 rounded text-white" type="button" onClick={addExpenseRow}>أضف</button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-300 font-semibold">تعليق</div>
              <textarea placeholder="أكتب ملاجظة" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-[#111827] border border-gray-600 p-2 rounded text-white mt-2" rows={3} />
            </div>

          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={onClose}>إلغاء</button>
          {/* <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={handleLogoutWithoutClosing}>Logout Without Closing</button> */}
          <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={handleCloseAndLogout} disabled={closeMutation.isLoading || logoutMutation.isLoading}>{closeMutation.isLoading || logoutMutation.isLoading ? 'الرجاء الإنتظار...' : 'حفظ و خروج'}</button>
        </div>

      </div>
    </Modal>
  );
};

export default SessionCloseModal;
