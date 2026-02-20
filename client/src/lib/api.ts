const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Rooms
  createRoom: (data: { host_display_name: string; host_photo_url?: string; expansions: string[]; player_id?: string }) =>
    request<any>('/rooms', { method: 'POST', body: JSON.stringify(data) }),

  joinRoom: (data: { room_code: string; display_name: string; photo_url?: string; player_id?: string }) =>
    request<any>('/rooms/join', { method: 'POST', body: JSON.stringify(data) }),

  getRoom: (roomId: string) =>
    request<any>(`/rooms/${roomId}`),

  updateExpansions: (roomId: string, playerId: string, expansions: string[]) =>
    request<any>(`/rooms/${roomId}/expansions`, { method: 'PUT', body: JSON.stringify({ player_id: playerId, expansions }) }),

  // Players
  getPlayer: (playerId: string) =>
    request<any>(`/players/${playerId}`),

  updatePlayer: (playerId: string, data: { display_name?: string; photo_url?: string }) =>
    request<any>(`/players/${playerId}`, { method: 'PUT', body: JSON.stringify(data) }),

  getPlayerHistory: (playerId: string) =>
    request<any>(`/players/${playerId}/history`),

  // Games
  getGameDetail: (roomId: string) =>
    request<any>(`/games/${roomId}/detail`),

  // Admin
  getAdminAnalytics: () =>
    request<any>('/admin/analytics'),

  getAdminCards: (includeInactive = true) =>
    request<any>(`/admin/cards?include_inactive=${includeInactive ? 'true' : 'false'}`),

  createAdminCard: (data: { card_type: string; card_text: string; expansion: string; is_active?: number }) =>
    request<any>('/admin/cards', { method: 'POST', body: JSON.stringify(data) }),

  updateAdminCard: (cardId: number, data: { card_type?: string; card_text?: string; expansion?: string; is_active?: number }) =>
    request<any>(`/admin/cards/${cardId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAdminCard: (cardId: number) =>
    request<any>(`/admin/cards/${cardId}`, { method: 'DELETE' }),

  exportAdminCards: async (): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/admin/cards/export`);
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  },

  importAdminCardsFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/admin/cards/import`, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(err.error || 'Import failed');
    }
    return res.json();
  },

  // Suggestions
  submitSuggestion: (data: { player_id?: string; card_type: string; card_text: string; expansion?: string }) =>
    request<any>('/suggestions', { method: 'POST', body: JSON.stringify(data) }),

  // Upload
  uploadPhoto: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE}/upload/photo`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.photo_url;
  },
};
