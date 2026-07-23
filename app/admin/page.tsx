"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Restaurant = {
  id: number; namePt: string; nameEn: string; nameEs: string;
  descriptionPt: string; descriptionEn: string; descriptionEs: string;
  imageUrl: string; bookingRequired: boolean; openingHours: string; capacity: number; active: boolean;
  menu1Label: string | null; menu1Url: string | null; menu2Label: string | null; menu2Url: string | null;
};

type Reservation = {
  id: number; code: string; guestName: string; roomNumber: string; whatsapp: string;
  reservationDate: string; reservationTime: string; guestCount: number; status: string;
  restaurantId: number; restaurantName: string; notes: string | null;
};

type Period = "day" | "week" | "month";
type Tab = "overview" | "reservations" | "restaurants";

const emptyRestaurant = {
  namePt: "", nameEn: "", nameEs: "", descriptionPt: "", descriptionEn: "", descriptionEs: "",
  imageUrl: "", bookingRequired: true, openingHours: "19:00 — 22:00", capacity: 60, active: true,
  menu1Label: "", menu1Url: "", menu2Label: "", menu2Url: "",
};

function iso(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function rangeFor(anchor: string, period: Period) {
  const date = new Date(`${anchor}T12:00:00`);
  if (period === "day") return { from: iso(date), to: iso(date) };
  if (period === "week") {
    const start = new Date(date);
    start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: iso(start), to: iso(end) };
  }
  return {
    from: iso(new Date(date.getFullYear(), date.getMonth(), 1, 12)),
    to: iso(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)),
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export default function AdminPage() {
  const [auth, setAuth] = useState<"loading" | "guest" | "admin">("loading");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("week");
  const [anchor, setAnchor] = useState(iso(new Date()));
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [summary, setSummary] = useState({ total: 0, guests: 0, cancelled: 0 });
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<null | (typeof emptyRestaurant & { id?: number })>(null);
  const [notice, setNotice] = useState("");
  const dateRange = useMemo(() => rangeFor(anchor, period), [anchor, period]);

  const loadRestaurants = useCallback(async () => {
    const response = await fetch("/api/admin/restaurants");
    if (response.status === 401) return setAuth("guest");
    if (response.ok) setRestaurants(await response.json());
  }, []);

  const loadReservations = useCallback(async () => {
    const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to, status: statusFilter });
    if (restaurantFilter !== "all") params.set("restaurantId", restaurantFilter);
    const response = await fetch(`/api/admin/reservations?${params}`);
    if (response.status === 401) return setAuth("guest");
    if (response.ok) {
      const data = await response.json();
      setReservations(data.reservations);
      setSummary(data.summary);
    }
  }, [dateRange.from, dateRange.to, restaurantFilter, statusFilter]);

  useEffect(() => {
    fetch("/api/admin/session").then((response) => response.json()).then((data) => setAuth(data.authenticated ? "admin" : "guest"));
  }, []);

  useEffect(() => {
    // The loaders synchronize the dashboard with the persisted API state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (auth === "admin") void Promise.all([loadRestaurants(), loadReservations()]);
  }, [auth, loadRestaurants, loadReservations]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    });
    if (!response.ok) return setLoginError("E-mail ou senha inválidos.");
    setAuth("admin");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuth("guest");
  }

  function movePeriod(direction: number) {
    const date = new Date(`${anchor}T12:00:00`);
    date.setDate(date.getDate() + direction * (period === "day" ? 1 : period === "week" ? 7 : 0));
    if (period === "month") date.setMonth(date.getMonth() + direction);
    setAnchor(iso(date));
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }),
    });
    setNotice("Status da reserva atualizado.");
    await loadReservations();
  }

  async function saveRestaurant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const response = await fetch(editor.id ? `/api/admin/restaurants/${editor.id}` : "/api/admin/restaurants", {
      method: editor.id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(editor),
    });
    if (!response.ok) return setNotice("Não foi possível salvar. Verifique nome e imagem.");
    setEditor(null);
    setNotice(editor.id ? "Restaurante atualizado." : "Restaurante cadastrado.");
    await loadRestaurants();
  }

  async function deactivateRestaurant(id: number) {
    if (!confirm("Deseja desativar este restaurante?")) return;
    await fetch(`/api/admin/restaurants/${id}`, { method: "DELETE" });
    setNotice("Restaurante desativado.");
    await loadRestaurants();
  }

  const visibleReservations = reservations.filter((item) => {
    const value = `${item.guestName} ${item.code} ${item.roomNumber} ${item.restaurantName}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  if (auth === "loading") return <main className="admin-loading">Carregando painel…</main>;

  if (auth === "guest") {
    return (
      <main className="admin-login">
        <section className="login-card">
          <Link className="admin-logo" href="/"><img src="/enotel-logo.png" alt="Enotel Hotels & Resorts" /></Link>
          <p>PAINEL ADMINISTRATIVO</p>
          <h1>Bem-vindo de volta</h1>
          <span>Entre para gerenciar reservas, restaurantes e cardápios.</span>
          <form onSubmit={login}>
            <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
            <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
            {loginError ? <div className="form-error">{loginError}</div> : null}
            <button className="admin-primary" type="submit">Entrar no painel</button>
          </form>
          <Link className="back-link" href="/">← Voltar ao site dos hóspedes</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="sidebar-brand" href="/"><img src="/enotel-logo.png" alt="Enotel" /><span>ADMINISTRAÇÃO</span></Link>
        <nav>
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>⌂ <span>Visão geral</span></button>
          <button className={tab === "reservations" ? "active" : ""} onClick={() => setTab("reservations")}>▣ <span>Reservas</span></button>
          <button className={tab === "restaurants" ? "active" : ""} onClick={() => setTab("restaurants")}>♢ <span>Restaurantes</span></button>
        </nav>
        <button className="logout-button" onClick={logout}>Sair do painel</button>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div><p>ENOTEL PORTO DE GALINHAS</p><h1>{tab === "restaurants" ? "Restaurantes" : tab === "reservations" ? "Reservas" : "Visão geral"}</h1></div>
          <div className="admin-user"><span>Administrador</span><strong>AE</strong></div>
        </header>

        {notice ? <button className="admin-notice" onClick={() => setNotice("")}>{notice} ×</button> : null}

        {tab !== "restaurants" ? (
          <>
            <section className="period-toolbar">
              <div className="period-tabs">
                {(["day", "week", "month"] as const).map((value) => (
                  <button key={value} className={period === value ? "active" : ""} onClick={() => setPeriod(value)}>
                    {value === "day" ? "Dia" : value === "week" ? "Semana" : "Mês"}
                  </button>
                ))}
              </div>
              <div className="date-navigation">
                <button onClick={() => movePeriod(-1)}>‹</button>
                <label><span>{formatDate(dateRange.from)}{dateRange.from !== dateRange.to ? ` — ${formatDate(dateRange.to)}` : ""}</span><input type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} /></label>
                <button onClick={() => movePeriod(1)}>›</button>
              </div>
            </section>

            <section className="metric-grid">
              <article><span>Reservas</span><strong>{summary.total}</strong><small>no período selecionado</small></article>
              <article><span>Hóspedes</span><strong>{summary.guests}</strong><small>confirmados no período</small></article>
              <article><span>Restaurantes</span><strong>{restaurants.filter((item) => item.active).length}</strong><small>ativos no sistema</small></article>
              <article><span>Cancelamentos</span><strong>{summary.cancelled}</strong><small>no período selecionado</small></article>
            </section>
          </>
        ) : null}

        {tab === "overview" ? (
          <section className="admin-panel">
            <div className="panel-title"><div><p>AGENDA DO PERÍODO</p><h2>Próximas reservas</h2></div><button onClick={() => setTab("reservations")}>Ver todas</button></div>
            <ReservationTable rows={visibleReservations.slice(0, 8)} onStatus={updateStatus} />
          </section>
        ) : null}

        {tab === "reservations" ? (
          <section className="admin-panel">
            <div className="panel-title"><div><p>GESTÃO DE RESERVAS</p><h2>Reservas do período</h2></div></div>
            <div className="reservation-filters">
              <input placeholder="Buscar hóspede, quarto ou código" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={restaurantFilter} onChange={(e) => setRestaurantFilter(e.target.value)}>
                <option value="all">Todos os restaurantes</option>
                {restaurants.map((item) => <option key={item.id} value={item.id}>{item.namePt}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Todos os status</option><option value="confirmed">Confirmada</option>
                <option value="seated">Recepcionado</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option>
              </select>
            </div>
            <ReservationTable rows={visibleReservations} onStatus={updateStatus} />
          </section>
        ) : null}

        {tab === "restaurants" ? (
          <section className="admin-panel">
            <div className="panel-title">
              <div><p>CATÁLOGO GASTRONÔMICO</p><h2>Restaurantes cadastrados</h2></div>
              <button className="admin-primary compact" onClick={() => setEditor({ ...emptyRestaurant })}>+ Novo restaurante</button>
            </div>
            <div className="admin-restaurant-grid">
              {restaurants.map((item) => (
                <article className={!item.active ? "inactive" : ""} key={item.id}>
                  <img src={item.imageUrl} alt="" />
                  <div><span>{item.active ? "ATIVO" : "INATIVO"}</span><h3>{item.namePt}</h3><p>{item.openingHours} · {item.capacity} lugares</p>
                    <small>{[item.menu1Url, item.menu2Url].filter(Boolean).length} cardápio(s)</small>
                    <div className="card-admin-actions">
                      <button onClick={() => setEditor({ ...emptyRestaurant, ...item, menu1Label: item.menu1Label || "", menu1Url: item.menu1Url || "", menu2Label: item.menu2Label || "", menu2Url: item.menu2Url || "" })}>Editar</button>
                      {item.active ? <button onClick={() => deactivateRestaurant(item.id)}>Desativar</button> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <nav className="admin-mobile-nav">
        <button onClick={() => setTab("overview")}>Início</button><button onClick={() => setTab("reservations")}>Reservas</button><button onClick={() => setTab("restaurants")}>Restaurantes</button>
      </nav>

      {editor ? (
        <div className="editor-backdrop">
          <form className="restaurant-editor" onSubmit={saveRestaurant}>
            <header><div><p>CADASTRO</p><h2>{editor.id ? "Editar restaurante" : "Novo restaurante"}</h2></div><button type="button" onClick={() => setEditor(null)}>×</button></header>
            <div className="editor-scroll">
              <h3>Informações em português</h3>
              <label>Nome<input value={editor.namePt} onChange={(e) => setEditor({ ...editor, namePt: e.target.value })} required /></label>
              <label>Descrição<textarea value={editor.descriptionPt} onChange={(e) => setEditor({ ...editor, descriptionPt: e.target.value })} /></label>
              <div className="editor-columns">
                <label>Nome em inglês<input value={editor.nameEn} onChange={(e) => setEditor({ ...editor, nameEn: e.target.value })} /></label>
                <label>Nome em espanhol<input value={editor.nameEs} onChange={(e) => setEditor({ ...editor, nameEs: e.target.value })} /></label>
              </div>
              <div className="editor-columns">
                <label>Descrição em inglês<textarea value={editor.descriptionEn} onChange={(e) => setEditor({ ...editor, descriptionEn: e.target.value })} /></label>
                <label>Descrição em espanhol<textarea value={editor.descriptionEs} onChange={(e) => setEditor({ ...editor, descriptionEs: e.target.value })} /></label>
              </div>
              <h3>Funcionamento</h3>
              <label>URL da imagem<input value={editor.imageUrl} onChange={(e) => setEditor({ ...editor, imageUrl: e.target.value })} placeholder="/minha-imagem.jpg ou https://..." required /></label>
              <div className="editor-columns">
                <label>Horário<input value={editor.openingHours} onChange={(e) => setEditor({ ...editor, openingHours: e.target.value })} /></label>
                <label>Capacidade<input type="number" min="1" value={editor.capacity} onChange={(e) => setEditor({ ...editor, capacity: Number(e.target.value) })} /></label>
              </div>
              <div className="editor-checks">
                <label><input type="checkbox" checked={editor.bookingRequired} onChange={(e) => setEditor({ ...editor, bookingRequired: e.target.checked })} /> Exige agendamento</label>
                <label><input type="checkbox" checked={editor.active} onChange={(e) => setEditor({ ...editor, active: e.target.checked })} /> Restaurante ativo</label>
              </div>
              <h3>Cardápios (até 2)</h3>
              <div className="editor-columns">
                <label>Nome do cardápio 1<input value={editor.menu1Label} onChange={(e) => setEditor({ ...editor, menu1Label: e.target.value })} /></label>
                <label>Link do cardápio 1<input value={editor.menu1Url} onChange={(e) => setEditor({ ...editor, menu1Url: e.target.value })} /></label>
                <label>Nome do cardápio 2<input value={editor.menu2Label} onChange={(e) => setEditor({ ...editor, menu2Label: e.target.value })} /></label>
                <label>Link do cardápio 2<input value={editor.menu2Url} onChange={(e) => setEditor({ ...editor, menu2Url: e.target.value })} /></label>
              </div>
            </div>
            <footer><button type="button" onClick={() => setEditor(null)}>Cancelar</button><button className="admin-primary" type="submit">Salvar restaurante</button></footer>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function ReservationTable({ rows, onStatus }: { rows: Reservation[]; onStatus: (id: number, status: string) => void }) {
  if (!rows.length) return <div className="admin-empty">Nenhuma reserva encontrada neste período.</div>;
  return (
    <div className="table-scroll"><table className="reservation-table"><thead><tr><th>Hóspede</th><th>Restaurante</th><th>Data e hora</th><th>Pessoas</th><th>Status</th></tr></thead>
      <tbody>{rows.map((item) => <tr key={item.id}>
        <td><strong>{item.guestName}</strong><small>Quarto {item.roomNumber} · {item.code}</small></td>
        <td>{item.restaurantName}</td><td>{formatDate(item.reservationDate)}<small>{item.reservationTime}</small></td>
        <td>{item.guestCount}</td><td><select className={`status-select ${item.status}`} value={item.status} onChange={(e) => onStatus(item.id, e.target.value)}>
          <option value="confirmed">Confirmada</option><option value="seated">Recepcionado</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option>
        </select></td>
      </tr>)}</tbody>
    </table></div>
  );
}
