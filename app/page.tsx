"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Language = "pt" | "en" | "es";
type Filter = "all" | "booking" | "open";
type Restaurant = {
  id: number; namePt: string; nameEn: string; nameEs: string;
  descriptionPt: string; descriptionEn: string; descriptionEs: string;
  imageUrl: string; bookingRequired: boolean; openingHours: string; capacity: number;
  menu1Label: string | null; menu1Url: string | null; menu2Label: string | null; menu2Url: string | null;
};

const fallback: Restaurant[] = [
  { id: 1, namePt: "Jantar Francês", nameEn: "French Dinner", nameEs: "Cena Francesa", descriptionPt: "Clássicos franceses em uma noite especial", descriptionEn: "French classics for a special evening", descriptionEs: "Clásicos franceses para una noche especial", imageUrl: "/restaurant-frances.jpg", bookingRequired: true, openingHours: "19:00 — 22:00", capacity: 60, menu1Label: null, menu1Url: null, menu2Label: null, menu2Url: null },
  { id: 2, namePt: "Sabores Mediterrâneos", nameEn: "Mediterranean Flavors", nameEs: "Sabores Mediterráneos", descriptionPt: "Ingredientes frescos e cozinha solar", descriptionEn: "Fresh ingredients and sun-kissed cuisine", descriptionEs: "Ingredientes frescos y cocina luminosa", imageUrl: "/restaurant-mediterraneo.jpg", bookingRequired: true, openingHours: "19:00 — 22:00", capacity: 60, menu1Label: null, menu1Url: null, menu2Label: null, menu2Url: null },
  { id: 3, namePt: "Grill & Petiscos", nameEn: "Grill & Bites", nameEs: "Parrilla y Aperitivos", descriptionPt: "Sabores descontraídos à beira da piscina", descriptionEn: "Relaxed flavors by the pool", descriptionEs: "Sabores relajados junto a la piscina", imageUrl: "/restaurant-grill.jpg", bookingRequired: false, openingHours: "12:00 — 18:00", capacity: 120, menu1Label: null, menu1Url: null, menu2Label: null, menu2Url: null },
];

const copy = {
  pt: {
    eyebrow: "EXPERIÊNCIAS GASTRONÔMICAS", title: "Qual sabor combina com hoje?",
    description: "Conheça os restaurantes, consulte os cardápios e reserve sua experiência sem sair do sistema.",
    search: "Buscar restaurante ou culinária", all: "Todos", booking: "Com agendamento", open: "Acesso livre",
    section: "Restaurantes", options: "opções", details: "Conhecer experiência", close: "Fechar",
    reserve: "Fazer agendamento", menu: "Ver cardápio", bookingLabel: "Agendamento necessário", openLabel: "Acesso livre",
    noResults: "Nenhum restaurante encontrado.", hours: "Funcionamento", capacity: "Capacidade",
    formTitle: "Reserve sua experiência", guest: "Nome do hóspede", room: "Número do quarto", phone: "WhatsApp",
    date: "Data", time: "Horário", people: "Número de pessoas", notes: "Observações (opcional)",
    confirm: "Confirmar agendamento", back: "Voltar", success: "Reserva confirmada!", successText: "Apresente este código na chegada:",
    error: "Não foi possível salvar a reserva. Tente novamente.", admin: "Acesso administrativo",
  },
  en: {
    eyebrow: "DINING EXPERIENCES", title: "What flavor matches today?",
    description: "Discover the restaurants, browse the menus and book your experience without leaving the system.",
    search: "Search restaurant or cuisine", all: "All", booking: "Booking required", open: "Walk-in",
    section: "Restaurants", options: "options", details: "Explore experience", close: "Close",
    reserve: "Book a table", menu: "View menu", bookingLabel: "Booking required", openLabel: "Walk-in",
    noResults: "No restaurants found.", hours: "Opening hours", capacity: "Capacity",
    formTitle: "Book your experience", guest: "Guest name", room: "Room number", phone: "WhatsApp",
    date: "Date", time: "Time", people: "Number of guests", notes: "Notes (optional)",
    confirm: "Confirm booking", back: "Back", success: "Booking confirmed!", successText: "Show this code upon arrival:",
    error: "We could not save your booking. Please try again.", admin: "Admin access",
  },
  es: {
    eyebrow: "EXPERIENCIAS GASTRONÓMICAS", title: "¿Qué sabor combina con hoy?",
    description: "Descubre los restaurantes, consulta los menús y reserva tu experiencia sin salir del sistema.",
    search: "Buscar restaurante o cocina", all: "Todos", booking: "Con reserva", open: "Acceso libre",
    section: "Restaurantes", options: "opciones", details: "Conocer experiencia", close: "Cerrar",
    reserve: "Hacer reserva", menu: "Ver menú", bookingLabel: "Reserva necesaria", openLabel: "Acceso libre",
    noResults: "No se encontraron restaurantes.", hours: "Horario", capacity: "Capacidad",
    formTitle: "Reserva tu experiencia", guest: "Nombre del huésped", room: "Número de habitación", phone: "WhatsApp",
    date: "Fecha", time: "Hora", people: "Número de personas", notes: "Observaciones (opcional)",
    confirm: "Confirmar reserva", back: "Volver", success: "¡Reserva confirmada!", successText: "Presenta este código al llegar:",
    error: "No fue posible guardar la reserva. Inténtalo de nuevo.", admin: "Acceso administrativo",
  },
} as const;

function localName(restaurant: Restaurant, language: Language) {
  return language === "pt" ? restaurant.namePt : language === "en" ? restaurant.nameEn : restaurant.nameEs;
}
function localDescription(restaurant: Restaurant, language: Language) {
  return language === "pt" ? restaurant.descriptionPt : language === "en" ? restaurant.descriptionEn : restaurant.descriptionEs;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("pt");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>(fallback);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState<{ code?: string; error?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const t = copy[language];

  useEffect(() => {
    fetch("/api/restaurants").then((response) => response.ok ? response.json() : Promise.reject()).then(setRestaurants).catch(() => undefined);
  }, []);

  const filtered = useMemo(() => restaurants.filter((restaurant) => {
    const matchesFilter = filter === "all" || (filter === "booking" && restaurant.bookingRequired) || (filter === "open" && !restaurant.bookingRequired);
    return matchesFilter && `${localName(restaurant, language)} ${localDescription(restaurant, language)}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [filter, language, query, restaurants]);

  function closeModal() {
    setSelected(null); setBooking(false); setResult({});
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true); setResult({});
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reservations", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        restaurantId: selected.id, guestName: form.get("guestName"), roomNumber: form.get("roomNumber"),
        whatsapp: form.get("whatsapp"), reservationDate: form.get("reservationDate"), reservationTime: form.get("reservationTime"),
        guestCount: Number(form.get("guestCount")), notes: form.get("notes"), language,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    setResult(response.ok ? { code: data.code } : { error: data.error || t.error });
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Enotel Porto de Galinhas">
          <img src="/enotel-logo.png" alt="Enotel Hotels & Resorts" />
          <span><strong>PORTO DE GALINHAS</strong><small>ALL INCLUSIVE 24H</small></span>
        </a>
        <div className="header-actions">
          <a className="admin-entry" href="/admin">{t.admin}</a>
          <nav className="language-switcher" aria-label="Selecionar idioma">
            {(["pt", "en", "es"] as const).map((item) => <button className={language === item ? "active" : ""} key={item} onClick={() => setLanguage(item)} type="button">{item.toUpperCase()}</button>)}
          </nav>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-wash" aria-hidden="true" />
        <div className="hero-content"><p className="eyebrow"><span />{t.eyebrow}</p><h1>{t.title}</h1><p className="hero-description">{t.description}</p></div>
        <div className="experience-mark" aria-hidden="true"><span className="sun" /><div><small>ENOTEL</small><strong>∞</strong><small>ALL INCLUSIVE 24H</small></div></div>
      </section>

      <section className="catalog" id="restaurants">
        <div className="tools">
          <label className="search"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} type="search" /></label>
          <div className="filters">
            {([["all", t.all], ["booking", t.booking], ["open", t.open]] as const).map(([value, label]) => <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{label}</button>)}
          </div>
        </div>
        <div className="section-heading"><div><p>ENOTEL PORTO DE GALINHAS</p><h2>{t.section}</h2></div><span>{filtered.length} {t.options}</span></div>
        {filtered.length ? <div className="restaurant-grid">
          {filtered.map((restaurant) => <article className="restaurant-card" key={restaurant.id}>
            <button className="card-trigger" onClick={() => { setSelected(restaurant); setBooking(false); setResult({}); }}>
              <div className="card-image"><img src={restaurant.imageUrl} alt={localName(restaurant, language)} /><span className={`status ${restaurant.bookingRequired ? "booking" : "open"}`}>{restaurant.bookingRequired ? t.bookingLabel : t.openLabel}</span></div>
              <div className="card-copy"><div><h3>{localName(restaurant, language)}</h3><p>{localDescription(restaurant, language)}</p></div><span className="arrow">↗</span></div>
            </button>
          </article>)}
        </div> : <div className="empty-state">{t.noResults}</div>}
      </section>

      {selected ? <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
        <section className={`modal ${booking ? "booking-modal" : ""}`} role="dialog" aria-modal="true">
          <button className="modal-close" onClick={closeModal} aria-label={t.close}>×</button>
          <img src={selected.imageUrl} alt="" />
          {!booking ? <div className="modal-copy">
            <p className="eyebrow compact">{t.eyebrow}</p><h2>{localName(selected, language)}</h2><p>{localDescription(selected, language)}</p>
            <dl><div><dt>{t.hours}</dt><dd>{selected.openingHours}</dd></div><div><dt>Status</dt><dd>{selected.bookingRequired ? t.bookingLabel : t.openLabel}</dd></div></dl>
            <div className="menu-links">
              {selected.menu1Url ? <a href={selected.menu1Url} target="_blank" rel="noreferrer">{selected.menu1Label || t.menu}</a> : null}
              {selected.menu2Url ? <a href={selected.menu2Url} target="_blank" rel="noreferrer">{selected.menu2Label || t.menu}</a> : null}
            </div>
            {selected.bookingRequired ? <button className="primary full" onClick={() => setBooking(true)}>{t.reserve}</button> : null}
          </div> : <div className="modal-copy reservation-copy">
            {result.code ? <div className="reservation-success"><span>✓</span><h2>{t.success}</h2><p>{t.successText}</p><strong>{result.code}</strong><button className="primary full" onClick={closeModal}>{t.close}</button></div> :
            <><button className="booking-back" onClick={() => setBooking(false)}>← {t.back}</button><h2>{t.formTitle}</h2><p className="booking-restaurant">{localName(selected, language)} · {selected.openingHours}</p>
              <form className="booking-form" onSubmit={submitReservation}>
                <label>{t.guest}<input name="guestName" required /></label>
                <div><label>{t.room}<input name="roomNumber" required /></label><label>{t.phone}<input name="whatsapp" type="tel" required /></label></div>
                <div><label>{t.date}<input name="reservationDate" type="date" min={new Date().toISOString().slice(0, 10)} required /></label><label>{t.time}<input name="reservationTime" type="time" required /></label></div>
                <label>{t.people}<input name="guestCount" type="number" min="1" max="12" defaultValue="2" required /></label>
                <label>{t.notes}<textarea name="notes" /></label>
                {result.error ? <p className="reservation-error">{result.error}</p> : null}
                <button className="primary full" type="submit" disabled={submitting}>{submitting ? "…" : t.confirm}</button>
              </form></>}
          </div>}
        </section>
      </div> : null}
    </main>
  );
}
