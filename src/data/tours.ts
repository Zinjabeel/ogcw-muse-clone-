// Tour guides. BTS: Arirang World Tour, every date, venue and (for the shows
// already played) the reported attendance and gross, from Wikipedia’s tour
// page. Dates are ISO strings; the page works out which shows have been
// played and which is next.

export type TourStop = { city: string; country: string; venue: string; dates: string[]; attendance?: string; gross?: string };
export type TourLeg = { name: string; stops: TourStop[] };

/** The stops still to play, the first of them possibly playing today (ISO date) */
export const upcomingStops = (tour: { legs: TourLeg[] }, today: string) =>
  tour.legs.flatMap((leg) => leg.stops).filter((stop) => stop.dates[stop.dates.length - 1]! >= today);

/** "Lima, 7–10 October" (long) or "Lima 7–10 Oct" (short) */
export function stopLabel(stop: TourStop, style: "long" | "short" = "long") {
  const month = new Intl.DateTimeFormat("en-GB", { month: style, timeZone: "UTC" });
  const first = new Date(stop.dates[0]!), last = new Date(stop.dates[stop.dates.length - 1]!);
  const day = (d: Date) => d.getUTCDate();
  const span = stop.dates.length === 1 ? `${day(first)} ${month.format(first)}`
    : first.getUTCMonth() === last.getUTCMonth() ? `${day(first)}–${day(last)} ${month.format(last)}`
    : `${day(first)} ${month.format(first)} – ${day(last)} ${month.format(last)}`;
  return style === "long" ? `${stop.city}, ${span}` : `${stop.city} ${span}`;
}

export const ARIRANG_TOUR = {
  name: "Arirang World Tour",
  artist: "BTS",
  start: "2026-04-09",
  end: "2027-03-16",
  shows: 88,
  cities: 34,
  countries: 23,
  story: "bts-arirang-world-tour-latin-america",
  source: { name: "Wikipedia: Arirang World Tour", url: "https://en.wikipedia.org/wiki/Arirang_World_Tour" },
  legs: [
    { name: "Asia", stops: [
      { city: "Goyang", country: "South Korea", venue: "Goyang Stadium", dates: ["2026-04-09", "2026-04-11", "2026-04-12"], attendance: "127,000", gross: "$16.9 million" },
      { city: "Tokyo", country: "Japan", venue: "Tokyo Dome", dates: ["2026-04-17", "2026-04-18"], attendance: "95,200", gross: "$18.6 million" },
    ] },
    { name: "North America", stops: [
      { city: "Tampa", country: "United States", venue: "Raymond James Stadium", dates: ["2026-04-25", "2026-04-26", "2026-04-28"], attendance: "194,000", gross: "$40.7 million" },
      { city: "El Paso", country: "United States", venue: "Sun Bowl", dates: ["2026-05-02", "2026-05-03"], attendance: "97,700", gross: "$20 million" },
      { city: "Mexico City", country: "Mexico", venue: "Estadio GNP Seguros", dates: ["2026-05-07", "2026-05-09", "2026-05-10"], attendance: "146,000", gross: "$27.8 million" },
      { city: "Stanford", country: "United States", venue: "Stanford Stadium", dates: ["2026-05-16", "2026-05-17", "2026-05-19"], attendance: "152,000", gross: "$30.5 million" },
      { city: "Las Vegas", country: "United States", venue: "Allegiant Stadium", dates: ["2026-05-23", "2026-05-24", "2026-05-27", "2026-05-28"], attendance: "246,000", gross: "$49.5 million" },
    ] },
    { name: "Asia", stops: [
      { city: "Busan", country: "South Korea", venue: "Busan Asiad Main Stadium", dates: ["2026-06-12", "2026-06-13"], attendance: "107,000", gross: "$13.6 million" },
    ] },
    { name: "Europe", stops: [
      { city: "Madrid", country: "Spain", venue: "Riyadh Air Metropolitano", dates: ["2026-06-26", "2026-06-27"], attendance: "135,000", gross: "$25.1 million" },
      { city: "Brussels", country: "Belgium", venue: "King Baudouin Stadium", dates: ["2026-07-01", "2026-07-02"], attendance: "126,000", gross: "$23.5 million" },
      { city: "London", country: "United Kingdom", venue: "Tottenham Hotspur Stadium", dates: ["2026-07-06", "2026-07-07"], attendance: "130,000", gross: "$24.7 million" },
      { city: "Munich", country: "Germany", venue: "Allianz Arena", dates: ["2026-07-11", "2026-07-12"], attendance: "141,000", gross: "$23.7 million" },
      { city: "Paris", country: "France", venue: "Stade de France", dates: ["2026-07-17", "2026-07-18"], attendance: "185,000", gross: "$30.6 million" },
    ] },
    { name: "North America", stops: [
      { city: "New York", country: "United States", venue: "MetLife Stadium, East Rutherford", dates: ["2026-08-01", "2026-08-02"], attendance: "158,000", gross: "$31.8 million" },
      { city: "Boston", country: "United States", venue: "Gillette Stadium, Foxborough", dates: ["2026-08-05", "2026-08-06"], attendance: "133,000", gross: "$28.7 million" },
      { city: "Baltimore", country: "United States", venue: "M&T Bank Stadium", dates: ["2026-08-10", "2026-08-11"], attendance: "141,000", gross: "$27.6 million" },
      { city: "Dallas", country: "United States", venue: "AT&T Stadium, Arlington", dates: ["2026-08-15", "2026-08-16"] },
      { city: "Toronto", country: "Canada", venue: "Rogers Stadium", dates: ["2026-08-22", "2026-08-23"] },
      { city: "Chicago", country: "United States", venue: "Soldier Field", dates: ["2026-08-27", "2026-08-28"] },
      { city: "Los Angeles", country: "United States", venue: "SoFi Stadium, Inglewood", dates: ["2026-09-01", "2026-09-02", "2026-09-05", "2026-09-06"] },
    ] },
    { name: "Latin America", stops: [
      { city: "Bogotá", country: "Colombia", venue: "Estadio El Campín", dates: ["2026-10-02", "2026-10-03"] },
      { city: "Lima", country: "Peru", venue: "Estadio San Marcos", dates: ["2026-10-07", "2026-10-09", "2026-10-10"] },
      { city: "Santiago", country: "Chile", venue: "Estadio Nacional", dates: ["2026-10-14", "2026-10-16", "2026-10-17", "2026-10-21"] },
      { city: "La Plata", country: "Argentina", venue: "Estadio Único Diego Armando Maradona", dates: ["2026-10-23", "2026-10-24", "2026-10-28"] },
      { city: "São Paulo", country: "Brazil", venue: "Estádio MorumBIS", dates: ["2026-10-30", "2026-10-31"] },
    ] },
    { name: "Asia", stops: [
      { city: "Kaohsiung", country: "Taiwan", venue: "Kaohsiung National Stadium", dates: ["2026-11-19", "2026-11-21", "2026-11-22"] },
      { city: "Bangkok", country: "Thailand", venue: "Rajamangala National Stadium", dates: ["2026-12-03", "2026-12-05", "2026-12-06"] },
      { city: "Kuala Lumpur", country: "Malaysia", venue: "National Stadium, Bukit Jalil", dates: ["2026-12-12", "2026-12-13", "2026-12-17"] },
      { city: "Singapore", country: "Singapore", venue: "National Stadium", dates: ["2026-12-19", "2026-12-20", "2026-12-22", "2026-12-26"] },
      { city: "Jakarta", country: "Indonesia", venue: "Gelora Bung Karno Stadium", dates: ["2026-12-27", "2026-12-29"] },
    ] },
    { name: "Oceania", stops: [
      { city: "Melbourne", country: "Australia", venue: "Marvel Stadium", dates: ["2027-02-10", "2027-02-12", "2027-02-13"] },
      { city: "Sydney", country: "Australia", venue: "Accor Stadium", dates: ["2027-02-20", "2027-02-21"] },
    ] },
    { name: "Asia", stops: [
      { city: "Hong Kong", country: "Hong Kong", venue: "Kai Tak Stadium", dates: ["2027-03-04", "2027-03-06", "2027-03-07"] },
      { city: "Bulacan", country: "Philippines", venue: "Philippine Sports Stadium, Bocaue", dates: ["2027-03-13", "2027-03-14", "2027-03-16"] },
    ] },
  ] satisfies TourLeg[],
  setlist: {
    "Act one": ["Hooligan", "Aliens", "Run BTS", "They Don’t Know ’bout Us", "Like Animals", "Fake Love", "Swim", "Merry Go Round"],
    "Act two": ["2.0", "Normal", "Not Today", "Mic Drop", "Fya", "Fire", "Body to Body", "Idol"],
    "Encore": ["Come Over", "Butter", "Dynamite", "Two surprise songs", "Please", "Into the Sun"],
  },
};
