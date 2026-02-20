import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { api } from '../lib/api';

type Card = {
  card_id: number;
  card_type: 'truth' | 'dare' | 'challenge' | 'group';
  card_text: string;
  expansion: 'core' | 'vanilla' | 'pineapple';
  is_active: number;
};

const CARD_TYPES = ['truth', 'dare', 'challenge', 'group'] as const;
const EXPANSIONS = ['core', 'vanilla', 'pineapple'] as const;

export default function AdminCards() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'truth' | 'dare' | 'challenge' | 'group'>('all');
  const [filterExpansion, setFilterExpansion] = useState<'all' | 'core' | 'vanilla' | 'pineapple'>('all');

  const [newType, setNewType] = useState<'truth' | 'dare' | 'challenge' | 'group'>('truth');
  const [newText, setNewText] = useState('');
  const [newExpansion, setNewExpansion] = useState<'core' | 'vanilla' | 'pineapple'>('core');

  const [editType, setEditType] = useState<'truth' | 'dare' | 'challenge' | 'group'>('truth');
  const [editText, setEditText] = useState('');
  const [editExpansion, setEditExpansion] = useState<'core' | 'vanilla' | 'pineapple'>('core');
  const [editActive, setEditActive] = useState(1);

  const selectedCard = useMemo(
    () => cards.find((c) => c.card_id === selectedId) || null,
    [cards, selectedId]
  );

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return cards.filter((card) => {
      const matchesQuery = !query
        || card.card_text.toLowerCase().includes(query)
        || `${card.card_id}`.includes(query);
      const matchesType = filterType === 'all' || card.card_type === filterType;
      const matchesExpansion = filterExpansion === 'all' || card.expansion === filterExpansion;
      return matchesQuery && matchesType && matchesExpansion;
    });
  }, [cards, searchQuery, filterType, filterExpansion]);

  const loadCards = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminCards(showInactive);
      setCards(res.cards || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [showInactive]);

  useEffect(() => {
    if (!selectedCard) return;
    setEditType(selectedCard.card_type);
    setEditText(selectedCard.card_text);
    setEditExpansion(selectedCard.expansion);
    setEditActive(selectedCard.is_active);
  }, [selectedCard]);

  const clearNotice = () => {
    setError('');
    setMessage('');
  };

  const handleCreate = async () => {
    if (!newText.trim()) {
      setError('Card text is required');
      return;
    }

    clearNotice();
    setSaving(true);
    try {
      const res = await api.createAdminCard({
        card_type: newType,
        card_text: newText.trim(),
        expansion: newExpansion,
        is_active: 1,
      });
      setCards((prev) => [res.card, ...prev]);
      setNewText('');
      setMessage('Card added');
    } catch (err: any) {
      setError(err.message || 'Failed to add card');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCard) return;
    if (!editText.trim()) {
      setError('Card text is required');
      return;
    }

    clearNotice();
    setSaving(true);
    try {
      const res = await api.updateAdminCard(selectedCard.card_id, {
        card_type: editType,
        card_text: editText.trim(),
        expansion: editExpansion,
        is_active: editActive,
      });
      setCards((prev) => prev.map((c) => (c.card_id === selectedCard.card_id ? res.card : c)));
      setMessage('Card updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCard) return;
    if (!confirm(`Delete card #${selectedCard.card_id}?`)) return;

    clearNotice();
    setSaving(true);
    try {
      await api.deleteAdminCard(selectedCard.card_id);
      setCards((prev) => prev.filter((c) => c.card_id !== selectedCard.card_id));
      setSelectedId(null);
      setMessage('Card deleted');
    } catch (err: any) {
      setError(err.message || 'Failed to delete card');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    clearNotice();
    try {
      const blob = await api.exportAdminCards();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pineapple-cards-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('CSV exported');
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
  };

  const handleImportFile = async (file: File | null | undefined) => {
    if (!file) return;
    clearNotice();
    setSaving(true);
    try {
      const res = await api.importAdminCardsFile(file);
      await loadCards();
      setMessage(`Import complete: ${res.created || 0} created, ${res.updated || 0} updated, ${res.failed || 0} failed`);
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen pp-shell p-6">
      <div className="max-w-4xl mx-auto space-y-6 pp-panel">
        <button onClick={() => navigate('/admin/analytics')} className="text-pp-text-muted hover:text-pp-text transition-colors">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-pp-text pp-title">Admin Card Management</h1>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2" disabled={saving}>
            <Icon name="download" size="sm" />
            Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center justify-center gap-2" disabled={saving}>
            <Icon name="upload" size="sm" />
            Import CSV
          </button>
          <label className="flex items-center gap-2 text-sm text-pp-text-muted px-2">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive cards
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
        </div>

        {error && <div className="rounded-xl border border-pp-red/30 bg-pp-red/10 p-3 text-sm text-pp-red">{error}</div>}
        {message && <div className="rounded-xl border border-pp-purple/30 bg-pp-purple/10 p-3 text-sm text-pp-text">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4 space-y-3">
            <h2 className="text-lg font-bold text-pp-text">Add Card</h2>
            <div className="grid grid-cols-2 gap-2">
              <select className="input-field" value={newType} onChange={(e) => setNewType(e.target.value as any)}>
                {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="input-field" value={newExpansion} onChange={(e) => setNewExpansion(e.target.value as any)}>
                {EXPANSIONS.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
              </select>
            </div>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Card text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <button onClick={handleCreate} className="btn-primary w-full flex items-center justify-center gap-2" disabled={saving}>
              <Icon name="plus" size="sm" />
              Add Card
            </button>
          </div>

          <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4 space-y-3">
            <h2 className="text-lg font-bold text-pp-text">Edit Selected</h2>
            {!selectedCard ? (
              <p className="text-sm text-pp-text-muted">Select a card below to edit.</p>
            ) : (
              <>
                <p className="text-xs text-pp-text-muted">Card #{selectedCard.card_id}</p>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input-field" value={editType} onChange={(e) => setEditType(e.target.value as any)}>
                    {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select className="input-field" value={editExpansion} onChange={(e) => setEditExpansion(e.target.value as any)}>
                    {EXPANSIONS.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
                  </select>
                </div>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm text-pp-text-muted">
                  <input type="checkbox" checked={editActive === 1} onChange={(e) => setEditActive(e.target.checked ? 1 : 0)} />
                  Active
                </label>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={saving}>
                    <Icon name="check" size="sm" />
                    Save
                  </button>
                  <button onClick={handleDelete} className="btn-danger flex-1 flex items-center justify-center gap-2" disabled={saving}>
                    <Icon name="trash" size="sm" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-pp-text">Cards ({filteredCards.length})</h2>
            <button onClick={loadCards} className="btn-muted" disabled={loading || saving}>Refresh</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              className="input-field"
              placeholder="Search card text or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
              <option value="all">All Types</option>
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select className="input-field" value={filterExpansion} onChange={(e) => setFilterExpansion(e.target.value as any)}>
              <option value="all">All Expansions</option>
              {EXPANSIONS.map((exp) => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-pp-text-muted">Loading cards...</p>
          ) : filteredCards.length === 0 ? (
            <p className="text-sm text-pp-text-muted">No cards found.</p>
          ) : (
            <div className="max-h-[420px] overflow-auto space-y-2">
              {filteredCards.map((card) => (
                <button
                  key={card.card_id}
                  onClick={() => setSelectedId(card.card_id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedId === card.card_id
                      ? 'border-pp-purple bg-pp-purple/15'
                      : 'border-pp-purple/20 bg-pp-surface/30 hover:border-pp-purple/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-pp-text-muted">#{card.card_id}</span>
                    <span className="text-xs text-pp-text-muted capitalize">{card.card_type} · {card.expansion} · {card.is_active ? 'active' : 'inactive'}</span>
                  </div>
                  <p className="text-sm text-pp-text mt-1">{card.card_text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
