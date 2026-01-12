import { useState, useEffect } from 'react';
import { 
  getUnderlyings, 
  saveUnderlying, 
  updateUnderlyingPrice, 
  updateUnderlyingVolatility,
  deleteUnderlying,
  createUnderlying 
} from '../utils/underlying';
import type { Underlying } from '../types';

interface UnderlyingManagerProps {
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  maxSelect?: number;
  singleSelect?: boolean;
}

export default function UnderlyingManager({ 
  selectedIds, 
  onSelect, 
  maxSelect = 1,
  singleSelect = false 
}: UnderlyingManagerProps) {
  const [underlyings, setUnderlyings] = useState<Underlying[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUnderlying, setNewUnderlying] = useState({
    name: '',
    spotPrice: 100,
    volatility: 0.2,
    symbol: '',
  });

  useEffect(() => {
    loadUnderlyings();
  }, []);

  const loadUnderlyings = () => {
    setUnderlyings(getUnderlyings());
  };

  const handleSelect = (id: string) => {
    if (singleSelect) {
      onSelect([id]);
    } else {
      if (selectedIds.includes(id)) {
        onSelect(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        if (selectedIds.length < maxSelect) {
          onSelect([...selectedIds, id]);
        } else {
          alert(`最多只能选择${maxSelect}个标的资产`);
        }
      }
    }
  };

  const handleUpdatePrice = (id: string, price: number) => {
    updateUnderlyingPrice(id, price);
    loadUnderlyings();
  };

  const handleUpdateVolatility = (id: string, volatility: number) => {
    updateUnderlyingVolatility(id, volatility);
    loadUnderlyings();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个标的资产吗？')) {
      deleteUnderlying(id);
      onSelect(selectedIds.filter(selectedId => selectedId !== id));
      loadUnderlyings();
    }
  };

  const handleAdd = () => {
    if (!newUnderlying.name) {
      alert('请输入标的资产名称');
      return;
    }
    const underlying = createUnderlying(
      newUnderlying.name,
      newUnderlying.spotPrice,
      newUnderlying.volatility,
      newUnderlying.symbol || undefined
    );
    saveUnderlying(underlying);
    loadUnderlyings();
    setNewUnderlying({ name: '', spotPrice: 100, volatility: 0.2, symbol: '' });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">标的资产管理</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {showAddForm ? '取消' : '+ 添加标的'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
            <input
              type="text"
              value={newUnderlying.name}
              onChange={(e) => setNewUnderlying({ ...newUnderlying, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例如：AAPL, 000001.SZ"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">现货价格</label>
              <input
                type="text"
                value={newUnderlying.spotPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                    const num = val === '' ? 0 : parseFloat(val);
                    setNewUnderlying({ ...newUnderlying, spotPrice: isNaN(num) ? 0 : num });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">波动率</label>
              <input
                type="text"
                value={newUnderlying.volatility}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^-?\d*\.?\d{0,4}$/.test(val)) {
                    const num = val === '' ? 0 : parseFloat(val);
                    setNewUnderlying({ ...newUnderlying, volatility: isNaN(num) ? 0 : num });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">交易代码</label>
              <input
                type="text"
                value={newUnderlying.symbol}
                onChange={(e) => setNewUnderlying({ ...newUnderlying, symbol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="可选"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            添加
          </button>
        </div>
      )}

      <div className="space-y-2">
        {underlyings.map(underlying => {
          const isSelected = selectedIds.includes(underlying.id);
          const isEditing = editingId === underlying.id;

          return (
            <div
              key={underlying.id}
              className={`border rounded-lg p-4 ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type={singleSelect ? 'radio' : 'checkbox'}
                      checked={isSelected}
                      onChange={() => handleSelect(underlying.id)}
                      className="cursor-pointer"
                    />
                    <span className="font-semibold">{underlying.name}</span>
                    {underlying.symbol && (
                      <span className="text-sm text-gray-500">({underlying.symbol})</span>
                    )}
                    {isSelected && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">已选择</span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">现货价格</label>
                        <input
                          type="text"
                          defaultValue={underlying.spotPrice}
                          onBlur={(e) => {
                            const price = parseFloat(e.target.value);
                            if (!isNaN(price)) {
                              handleUpdatePrice(underlying.id, price);
                              setEditingId(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const price = parseFloat((e.target as HTMLInputElement).value);
                              if (!isNaN(price)) {
                                handleUpdatePrice(underlying.id, price);
                                setEditingId(null);
                              }
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">波动率</label>
                        <input
                          type="text"
                          defaultValue={underlying.volatility}
                          onBlur={(e) => {
                            const vol = parseFloat(e.target.value);
                            if (!isNaN(vol)) {
                              handleUpdateVolatility(underlying.id, vol);
                              setEditingId(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const vol = parseFloat((e.target as HTMLInputElement).value);
                              if (!isNaN(vol)) {
                                handleUpdateVolatility(underlying.id, vol);
                                setEditingId(null);
                              }
                            }
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>现货价格: <span className="font-medium">{underlying.spotPrice.toFixed(2)}</span></div>
                      <div>波动率: <span className="font-medium">{(underlying.volatility * 100).toFixed(2)}%</span></div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {!isEditing && (
                    <button
                      onClick={() => setEditingId(underlying.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      编辑
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(underlying.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {underlyings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>暂无标的资产，请添加</p>
        </div>
      )}
    </div>
  );
}

