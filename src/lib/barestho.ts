// TODO: Obtenir les accès partenaire auprès de Barestho (société basée à Mons)
// pour pouvoir interroger leur API et afficher les réservations du jour
// à côté des commandes sur la tablette du restaurant.
//
// Contact Barestho : https://www.barestho.com/
// Documentation API partenaire : à demander via l'espace pro.
//
// Une fois les accès obtenus, ce module exposera :
// - getReservationsForDate(date: string): Promise<Reservation[]>
// - getReservationById(id: string): Promise<Reservation | null>
//
// Les réservations resteront gérées côté Barestho (source de vérité).
// Nous ne stockons rien localement — lecture seule.

export const BARESTHO_URL =
  process.env.NEXT_PUBLIC_BARESTHO_URL ||
  "https://legrilldufour.reservation.barestho.com/";

export const BARESTHO_WIDGET_URL = BARESTHO_URL.endsWith("/")
  ? `${BARESTHO_URL}?view=widget`
  : `${BARESTHO_URL}/?view=widget`;

export interface Reservation {
  id: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: "confirmed" | "pending" | "cancelled";
}

// TODO: implémenter avec les accès API partenaire Barestho
// export async function getReservationsForDate(date: string): Promise<Reservation[]> { ... }
// export async function getReservationById(id: string): Promise<Reservation | null> { ... }
