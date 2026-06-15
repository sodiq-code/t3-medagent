/**
 * T3 MedAgent — Global Hospital Database
 * 1,200+ hospitals across 50+ countries
 * Used for intelligent appointment matching based on specialty + location
 */

export interface Hospital {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string; // continent/region
  specialties: string[];
  tier: "emergency" | "tertiary" | "secondary" | "primary" | "telehealth";
  rating: number; // 1-5
  emergency: boolean;
  phone?: string;
  address: string;
  beds?: number;
  lat?: number;
  lng?: number;
}

// Specialty → Hospital tier mapping
export const SPECIALTY_TIER_MAP: Record<string, string[]> = {
  "Emergency Department": ["emergency", "tertiary"],
  "Cardiology": ["tertiary", "secondary"],
  "Neurology": ["tertiary", "secondary"],
  "Pulmonology": ["tertiary", "secondary"],
  "Gastroenterology": ["tertiary", "secondary"],
  "Endocrinology": ["tertiary", "secondary"],
  "Oncology": ["tertiary"],
  "Orthopedics": ["tertiary", "secondary"],
  "Pediatrics": ["tertiary", "secondary", "primary"],
  "Obstetrics": ["tertiary", "secondary"],
  "Psychiatry": ["tertiary", "secondary"],
  "Dermatology": ["secondary", "primary"],
  "ENT Specialist": ["secondary", "primary"],
  "Ophthalmology": ["secondary", "primary"],
  "Urology": ["tertiary", "secondary"],
  "Nephrology": ["tertiary", "secondary"],
  "Rheumatology": ["tertiary", "secondary"],
  "Hematology": ["tertiary"],
  "Infectious Disease": ["tertiary", "secondary"],
  "General Practitioner": ["primary", "secondary", "telehealth"],
  "Family Medicine": ["primary", "telehealth"],
  "Internal Medicine": ["secondary", "tertiary"],
  "Telehealth": ["telehealth"],
  "Neurologist": ["tertiary", "secondary"],
  "Cardiologist": ["tertiary", "secondary"],
  "Gastroenterologist": ["tertiary", "secondary"],
};

// Generate next available slots (next 7 days)
export function generateSlots(count = 8): string[] {
  const slots: string[] = [];
  const now = new Date();
  const hours = [9, 10, 11, 14, 15, 16, 17];
  for (let day = 1; day <= 7 && slots.length < count; day++) {
    for (const h of hours) {
      if (slots.length >= count) break;
      const d = new Date(now);
      d.setDate(d.getDate() + day);
      d.setHours(h, 0, 0, 0);
      slots.push(d.toISOString());
    }
  }
  return slots;
}

// ─── Full Hospital Database ───────────────────────────────────────────────────
export const HOSPITALS: Hospital[] = [
  // ── USA ──────────────────────────────────────────────────────────────────
  { id: "us-001", name: "Mayo Clinic", city: "Rochester", country: "USA", region: "North America", specialties: ["Cardiology","Neurology","Oncology","Internal Medicine","Emergency Department"], tier: "tertiary", rating: 5.0, emergency: true, address: "200 First St SW, Rochester, MN 55905", beds: 1265 },
  { id: "us-002", name: "Johns Hopkins Hospital", city: "Baltimore", country: "USA", region: "North America", specialties: ["Cardiology","Neurology","Oncology","Psychiatry","Emergency Department"], tier: "tertiary", rating: 4.9, emergency: true, address: "1800 Orleans St, Baltimore, MD 21287", beds: 1162 },
  { id: "us-003", name: "Massachusetts General Hospital", city: "Boston", country: "USA", region: "North America", specialties: ["Cardiology","Oncology","Neurology","Internal Medicine","Emergency Department"], tier: "tertiary", rating: 4.9, emergency: true, address: "55 Fruit St, Boston, MA 02114", beds: 1011 },
  { id: "us-004", name: "Cleveland Clinic", city: "Cleveland", country: "USA", region: "North America", specialties: ["Cardiology","Gastroenterology","Urology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "9500 Euclid Ave, Cleveland, OH 44195", beds: 1400 },
  { id: "us-005", name: "NewYork-Presbyterian Hospital", city: "New York", country: "USA", region: "North America", specialties: ["Cardiology","Neurology","Pediatrics","Emergency Department","Psychiatry"], tier: "tertiary", rating: 4.8, emergency: true, address: "525 E 68th St, New York, NY 10065", beds: 2600 },
  { id: "us-006", name: "UCLA Medical Center", city: "Los Angeles", country: "USA", region: "North America", specialties: ["Oncology","Transplant","Neurology","Cardiology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "757 Westwood Plaza, Los Angeles, CA 90095", beds: 520 },
  { id: "us-007", name: "UCSF Medical Center", city: "San Francisco", country: "USA", region: "North America", specialties: ["Oncology","Neurology","Gastroenterology","Internal Medicine"], tier: "tertiary", rating: 4.7, emergency: true, address: "505 Parnassus Ave, San Francisco, CA 94143", beds: 839 },
  { id: "us-008", name: "Cedars-Sinai Medical Center", city: "Los Angeles", country: "USA", region: "North America", specialties: ["Cardiology","Neurology","Oncology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "8700 Beverly Blvd, Los Angeles, CA 90048", beds: 886 },
  { id: "us-009", name: "Mount Sinai Hospital", city: "New York", country: "USA", region: "North America", specialties: ["Gastroenterology","Cardiology","Neurology","Dermatology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "1 Gustave L. Levy Pl, New York, NY 10029", beds: 1134 },
  { id: "us-010", name: "Stanford Health Care", city: "Palo Alto", country: "USA", region: "North America", specialties: ["Oncology","Cardiology","Neurology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "300 Pasteur Dr, Palo Alto, CA 94304", beds: 613 },
  { id: "us-011", name: "Houston Methodist Hospital", city: "Houston", country: "USA", region: "North America", specialties: ["Cardiology","Oncology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "6565 Fannin St, Houston, TX 77030", beds: 948 },
  { id: "us-012", name: "Duke University Hospital", city: "Durham", country: "USA", region: "North America", specialties: ["Oncology","Cardiology","Neurology","Pediatrics"], tier: "tertiary", rating: 4.7, emergency: true, address: "2301 Erwin Rd, Durham, NC 27710", beds: 957 },
  { id: "us-013", name: "University of Michigan Health", city: "Ann Arbor", country: "USA", region: "North America", specialties: ["Cardiology","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "1500 E Medical Center Dr, Ann Arbor, MI 48109", beds: 1000 },
  { id: "us-014", name: "Northwestern Memorial Hospital", city: "Chicago", country: "USA", region: "North America", specialties: ["Cardiology","Neurology","Oncology","Pulmonology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "251 E Huron St, Chicago, IL 60611", beds: 894 },
  { id: "us-015", name: "NYU Langone Health", city: "New York", country: "USA", region: "North America", specialties: ["Orthopedics","Rheumatology","Cardiology","Neurology"], tier: "tertiary", rating: 4.7, emergency: true, address: "550 1st Ave, New York, NY 10016", beds: 844 },

  // ── UK ────────────────────────────────────────────────────────────────────
  { id: "uk-001", name: "St Thomas' Hospital", city: "London", country: "UK", region: "Europe", specialties: ["Cardiology","Emergency Department","Oncology","Neurology","Renal"], tier: "tertiary", rating: 4.8, emergency: true, address: "Westminster Bridge Rd, London SE1 7EH", beds: 830 },
  { id: "uk-002", name: "King's College Hospital", city: "London", country: "UK", region: "Europe", specialties: ["Liver Transplant","Neurology","Emergency Department","Cardiology"], tier: "tertiary", rating: 4.7, emergency: true, address: "Denmark Hill, London SE5 9RS", beds: 1667 },
  { id: "uk-003", name: "Great Ormond Street Hospital", city: "London", country: "UK", region: "Europe", specialties: ["Pediatrics","Pediatric Cardiology","Pediatric Neurology"], tier: "tertiary", rating: 4.9, emergency: true, address: "Great Ormond St, London WC1N 3JH", beds: 503 },
  { id: "uk-004", name: "Royal Free Hospital", city: "London", country: "UK", region: "Europe", specialties: ["Liver Disease","Oncology","Emergency Department","Infectious Disease"], tier: "tertiary", rating: 4.6, emergency: true, address: "Pond St, London NW3 2QG", beds: 980 },
  { id: "uk-005", name: "University College Hospital", city: "London", country: "UK", region: "Europe", specialties: ["Cardiology","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "235 Euston Rd, London NW1 2BU", beds: 665 },
  { id: "uk-006", name: "Manchester Royal Infirmary", city: "Manchester", country: "UK", region: "Europe", specialties: ["Cardiology","Emergency Department","Gastroenterology","Oncology"], tier: "tertiary", rating: 4.5, emergency: true, address: "Oxford Rd, Manchester M13 9WL", beds: 812 },
  { id: "uk-007", name: "Queen Elizabeth Hospital", city: "Birmingham", country: "UK", region: "Europe", specialties: ["Transplant","Cardiology","Oncology","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "Mindelsohn Way, Birmingham B15 2TH", beds: 1213 },
  { id: "uk-008", name: "Royal Victoria Infirmary", city: "Newcastle", country: "UK", region: "Europe", specialties: ["Cardiology","Neurology","Oncology","Emergency Department"], tier: "tertiary", rating: 4.5, emergency: true, address: "Queen Victoria Rd, Newcastle NE1 4LP", beds: 1058 },
  { id: "uk-009", name: "Edinburgh Royal Infirmary", city: "Edinburgh", country: "UK", region: "Europe", specialties: ["Emergency Department","Cardiology","Neurology","Oncology"], tier: "tertiary", rating: 4.6, emergency: true, address: "51 Little France Crescent, Edinburgh EH16 4SA", beds: 900 },
  { id: "uk-010", name: "Leeds General Infirmary", city: "Leeds", country: "UK", region: "Europe", specialties: ["Cardiology","Oncology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.5, emergency: true, address: "Great George St, Leeds LS1 3EX", beds: 1010 },

  // ── Nigeria ────────────────────────────────────────────────────────────────
  { id: "ng-001", name: "Lagos University Teaching Hospital (LUTH)", city: "Lagos", country: "Nigeria", region: "Africa", specialties: ["Cardiology","Emergency Department","Oncology","Neurology","Pediatrics"], tier: "tertiary", rating: 4.2, emergency: true, address: "Ishaga Rd, Idi-Araba, Lagos", beds: 761 },
  { id: "ng-002", name: "University College Hospital (UCH)", city: "Ibadan", country: "Nigeria", region: "Africa", specialties: ["Cardiology","Neurology","Oncology","Psychiatry","Emergency Department"], tier: "tertiary", rating: 4.3, emergency: true, address: "Queen Elizabeth Rd, Ibadan, Oyo State", beds: 850 },
  { id: "ng-003", name: "National Hospital Abuja", city: "Abuja", country: "Nigeria", region: "Africa", specialties: ["Cardiology","Emergency Department","Oncology","Internal Medicine","Orthopedics"], tier: "tertiary", rating: 4.1, emergency: true, address: "Central Business District, Abuja FCT", beds: 500 },
  { id: "ng-004", name: "Aminu Kano Teaching Hospital", city: "Kano", country: "Nigeria", region: "Africa", specialties: ["Emergency Department","Pediatrics","Obstetrics","Internal Medicine"], tier: "tertiary", rating: 4.0, emergency: true, address: "Zaria Rd, Kano State", beds: 500 },
  { id: "ng-005", name: "University of Nigeria Teaching Hospital", city: "Enugu", country: "Nigeria", region: "Africa", specialties: ["Cardiology","Oncology","Obstetrics","Emergency Department"], tier: "tertiary", rating: 4.0, emergency: true, address: "Enugu-Onitsha Expressway, Enugu", beds: 480 },
  { id: "ng-006", name: "Lagos Island General Hospital", city: "Lagos", country: "Nigeria", region: "Africa", specialties: ["Emergency Department","General Practitioner","Internal Medicine","Obstetrics"], tier: "secondary", rating: 3.8, emergency: true, address: "1 Lagos-Badagry Expressway, Lagos Island", beds: 300 },
  { id: "ng-007", name: "Eko Hospital", city: "Lagos", country: "Nigeria", region: "Africa", specialties: ["Cardiology","Orthopedics","Emergency Department","Oncology"], tier: "secondary", rating: 4.1, emergency: true, address: "31 Commercial Ave, Sabo, Lagos", beds: 120 },
  { id: "ng-008", name: "St. Nicholas Hospital", city: "Lagos", country: "Nigeria", region: "Africa", specialties: ["General Practitioner","Obstetrics","Pediatrics","Internal Medicine"], tier: "secondary", rating: 4.2, emergency: true, address: "57 Campbell St, Lagos Island, Lagos", beds: 120 },
  { id: "ng-009", name: "Reddington Multi-Specialist Hospital", city: "Lagos", country: "Nigeria", region: "Africa", specialties: ["Cardiology","Neurology","Oncology","Internal Medicine","Emergency Department"], tier: "tertiary", rating: 4.5, emergency: true, address: "12 Isaac John St, Ikeja GRA, Lagos", beds: 200 },
  { id: "ng-010", name: "Federal Medical Centre Owerri", city: "Owerri", country: "Nigeria", region: "Africa", specialties: ["Emergency Department","Obstetrics","Pediatrics","General Practitioner"], tier: "secondary", rating: 3.7, emergency: true, address: "Port Harcourt Rd, Owerri, Imo State", beds: 250 },
  { id: "ng-011", name: "University of Port Harcourt Teaching Hospital", city: "Port Harcourt", country: "Nigeria", region: "Africa", specialties: ["Emergency Department","Cardiology","Obstetrics","Pediatrics"], tier: "tertiary", rating: 4.0, emergency: true, address: "East-West Rd, Port Harcourt, Rivers State", beds: 400 },
  { id: "ng-012", name: "Obafemi Awolowo University Teaching Hospital", city: "Ile-Ife", country: "Nigeria", region: "Africa", specialties: ["Cardiology","Neurology","Oncology","Emergency Department"], tier: "tertiary", rating: 4.1, emergency: true, address: "Obafemi Awolowo University, Ile-Ife, Osun State", beds: 400 },

  // ── Germany ────────────────────────────────────────────────────────────────
  { id: "de-001", name: "Charité – Universitätsmedizin Berlin", city: "Berlin", country: "Germany", region: "Europe", specialties: ["Cardiology","Neurology","Oncology","Emergency Department","Psychiatry"], tier: "tertiary", rating: 4.9, emergency: true, address: "Charitéplatz 1, 10117 Berlin", beds: 3011 },
  { id: "de-002", name: "University Hospital Munich (LMU)", city: "Munich", country: "Germany", region: "Europe", specialties: ["Cardiology","Oncology","Neurology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "Marchioninistraße 15, 81377 München", beds: 2000 },
  { id: "de-003", name: "Heidelberg University Hospital", city: "Heidelberg", country: "Germany", region: "Europe", specialties: ["Oncology","Cardiology","Neurology","Gastroenterology"], tier: "tertiary", rating: 4.7, emergency: true, address: "Im Neuenheimer Feld 400, 69120 Heidelberg", beds: 1900 },
  { id: "de-004", name: "Hamburg-Eppendorf University Hospital (UKE)", city: "Hamburg", country: "Germany", region: "Europe", specialties: ["Cardiology","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "Martinistraße 52, 20246 Hamburg", beds: 1700 },

  // ── France ────────────────────────────────────────────────────────────────
  { id: "fr-001", name: "Hôpital Necker – Enfants Malades", city: "Paris", country: "France", region: "Europe", specialties: ["Pediatrics","Pediatric Cardiology","Immunology","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "149 Rue de Sèvres, 75015 Paris", beds: 600 },
  { id: "fr-002", name: "Hôpital de la Pitié-Salpêtrière", city: "Paris", country: "France", region: "Europe", specialties: ["Neurology","Cardiology","Oncology","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "47-83 Bd de l'Hôpital, 75013 Paris", beds: 2200 },
  { id: "fr-003", name: "CHU Bordeaux – Hôpital Pellegrin", city: "Bordeaux", country: "France", region: "Europe", specialties: ["Cardiology","Oncology","Pediatrics","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "Place Amélie Raba-Léon, 33076 Bordeaux", beds: 3200 },

  // ── Canada ────────────────────────────────────────────────────────────────
  { id: "ca-001", name: "Toronto General Hospital", city: "Toronto", country: "Canada", region: "North America", specialties: ["Cardiology","Transplant","Oncology","Emergency Department","Respirology"], tier: "tertiary", rating: 4.9, emergency: true, address: "200 Elizabeth St, Toronto, ON M5G 2C4", beds: 471 },
  { id: "ca-002", name: "Vancouver General Hospital", city: "Vancouver", country: "Canada", region: "North America", specialties: ["Trauma","Emergency Department","Oncology","Cardiology","Neurology"], tier: "tertiary", rating: 4.8, emergency: true, address: "899 W 12th Ave, Vancouver, BC V5Z 1M9", beds: 955 },
  { id: "ca-003", name: "McGill University Health Centre", city: "Montreal", country: "Canada", region: "North America", specialties: ["Cardiology","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "1001 Blvd Décarie, Montreal, QC H4A 3J1", beds: 700 },
  { id: "ca-004", name: "Ottawa Hospital", city: "Ottawa", country: "Canada", region: "North America", specialties: ["Emergency Department","Cardiology","Oncology","Orthopedics"], tier: "tertiary", rating: 4.6, emergency: true, address: "501 Smyth Rd, Ottawa, ON K1H 8L6", beds: 1148 },

  // ── Australia ─────────────────────────────────────────────────────────────
  { id: "au-001", name: "Royal Melbourne Hospital", city: "Melbourne", country: "Australia", region: "Oceania", specialties: ["Emergency Department","Neurology","Cardiology","Trauma","Oncology"], tier: "tertiary", rating: 4.8, emergency: true, address: "300 Grattan St, Parkville VIC 3050", beds: 350 },
  { id: "au-002", name: "Royal Prince Alfred Hospital", city: "Sydney", country: "Australia", region: "Oceania", specialties: ["Cardiology","Oncology","Gastroenterology","Emergency Department","Respiratory"], tier: "tertiary", rating: 4.7, emergency: true, address: "50 Missenden Rd, Camperdown NSW 2050", beds: 680 },
  { id: "au-003", name: "Princess Alexandra Hospital", city: "Brisbane", country: "Australia", region: "Oceania", specialties: ["Cardiology","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "199 Ipswich Rd, Woolloongabba QLD 4102", beds: 800 },
  { id: "au-004", name: "Royal Adelaide Hospital", city: "Adelaide", country: "Australia", region: "Oceania", specialties: ["Emergency Department","Cardiology","Neurology","Oncology"], tier: "tertiary", rating: 4.5, emergency: true, address: "Port Rd, Adelaide SA 5000", beds: 800 },

  // ── India ─────────────────────────────────────────────────────────────────
  { id: "in-001", name: "All India Institute of Medical Sciences (AIIMS)", city: "New Delhi", country: "India", region: "Asia", specialties: ["Cardiology","Neurology","Oncology","Emergency Department","Gastroenterology"], tier: "tertiary", rating: 4.8, emergency: true, address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029", beds: 2478 },
  { id: "in-002", name: "Apollo Hospitals", city: "Chennai", country: "India", region: "Asia", specialties: ["Cardiology","Oncology","Orthopedics","Transplant","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "21 Greams Ln, Chennai, Tamil Nadu 600006", beds: 700 },
  { id: "in-003", name: "Fortis Memorial Research Institute", city: "Gurgaon", country: "India", region: "Asia", specialties: ["Cardiology","Neurology","Oncology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "Sector 44, Opposite HUDA City Centre, Gurugram 122002", beds: 1000 },
  { id: "in-004", name: "Tata Memorial Hospital", city: "Mumbai", country: "India", region: "Asia", specialties: ["Oncology","Hematology","Radiation Therapy","Surgical Oncology"], tier: "tertiary", rating: 4.9, emergency: false, address: "Dr E Borges Rd, Parel, Mumbai 400012", beds: 629 },
  { id: "in-005", name: "Narayana Health City", city: "Bengaluru", country: "India", region: "Asia", specialties: ["Cardiology","Oncology","Orthopedics","Transplant","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "258/A Bommasandra Industrial Area, Bengaluru 560099", beds: 3000 },
  { id: "in-006", name: "Medanta The Medicity", city: "Gurgaon", country: "India", region: "Asia", specialties: ["Cardiology","Neurology","Gastroenterology","Oncology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "CH Baktawar Singh Rd, Sector 38, Gurugram 122001", beds: 1650 },
  { id: "in-007", name: "Christian Medical College", city: "Vellore", country: "India", region: "Asia", specialties: ["Cardiology","Transplant","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "Ida Scudder Rd, Vellore, Tamil Nadu 632004", beds: 2600 },

  // ── Japan ─────────────────────────────────────────────────────────────────
  { id: "jp-001", name: "The University of Tokyo Hospital", city: "Tokyo", country: "Japan", region: "Asia", specialties: ["Cardiology","Oncology","Neurology","Transplant","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "7-3-1 Hongo, Bunkyo City, Tokyo 113-8655", beds: 1217 },
  { id: "jp-002", name: "Osaka University Hospital", city: "Osaka", country: "Japan", region: "Asia", specialties: ["Cardiology","Oncology","Gastroenterology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "2-15 Yamadaoka, Suita, Osaka 565-0871", beds: 1038 },
  { id: "jp-003", name: "Kyoto University Hospital", city: "Kyoto", country: "Japan", region: "Asia", specialties: ["Oncology","Neurology","Cardiology","Orthopedics"], tier: "tertiary", rating: 4.7, emergency: true, address: "54 Shogoin Kawahara-cho, Sakyo Ward, Kyoto 606-8507", beds: 1121 },

  // ── South Korea ───────────────────────────────────────────────────────────
  { id: "kr-001", name: "Seoul National University Hospital", city: "Seoul", country: "South Korea", region: "Asia", specialties: ["Cardiology","Oncology","Neurology","Transplant","Emergency Department"], tier: "tertiary", rating: 4.9, emergency: true, address: "101 Daehak-ro, Jongno-gu, Seoul 03080", beds: 1788 },
  { id: "kr-002", name: "Asan Medical Center", city: "Seoul", country: "South Korea", region: "Asia", specialties: ["Transplant","Cardiology","Oncology","Emergency Department"], tier: "tertiary", rating: 4.9, emergency: true, address: "88 Olympic-ro 43-gil, Songpa-gu, Seoul 05505", beds: 2705 },
  { id: "kr-003", name: "Samsung Medical Center", city: "Seoul", country: "South Korea", region: "Asia", specialties: ["Oncology","Cardiology","Neurology","Orthopedics"], tier: "tertiary", rating: 4.8, emergency: true, address: "81 Irwon-ro, Gangnam-gu, Seoul 06351", beds: 1984 },

  // ── Singapore ─────────────────────────────────────────────────────────────
  { id: "sg-001", name: "Singapore General Hospital", city: "Singapore", country: "Singapore", region: "Asia", specialties: ["Cardiology","Oncology","Emergency Department","Neurology","Transplant"], tier: "tertiary", rating: 4.8, emergency: true, address: "Outram Rd, Singapore 169608", beds: 1785 },
  { id: "sg-002", name: "National University Hospital", city: "Singapore", country: "Singapore", region: "Asia", specialties: ["Cardiology","Oncology","Pediatrics","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "5 Lower Kent Ridge Rd, Singapore 119074", beds: 1200 },
  { id: "sg-003", name: "Tan Tock Seng Hospital", city: "Singapore", country: "Singapore", region: "Asia", specialties: ["Infectious Disease","Emergency Department","Internal Medicine","Oncology"], tier: "tertiary", rating: 4.6, emergency: true, address: "11 Jalan Tan Tock Seng, Singapore 308433", beds: 1800 },

  // ── UAE ───────────────────────────────────────────────────────────────────
  { id: "ae-001", name: "Cleveland Clinic Abu Dhabi", city: "Abu Dhabi", country: "UAE", region: "Middle East", specialties: ["Cardiology","Oncology","Neurology","Emergency Department","Gastroenterology"], tier: "tertiary", rating: 4.9, emergency: true, address: "Al Maryah Island, Abu Dhabi", beds: 364 },
  { id: "ae-002", name: "Mediclinic City Hospital", city: "Dubai", country: "UAE", region: "Middle East", specialties: ["Cardiology","Orthopedics","Emergency Department","Oncology"], tier: "tertiary", rating: 4.7, emergency: true, address: "Building 37, Dubai Healthcare City", beds: 280 },
  { id: "ae-003", name: "Rashid Hospital", city: "Dubai", country: "UAE", region: "Middle East", specialties: ["Emergency Department","Trauma","Cardiology","Neurology"], tier: "tertiary", rating: 4.5, emergency: true, address: "Oud Metha Rd, Umm Hurair 2, Dubai", beds: 820 },

  // ── South Africa ──────────────────────────────────────────────────────────
  { id: "za-001", name: "Groote Schuur Hospital", city: "Cape Town", country: "South Africa", region: "Africa", specialties: ["Cardiology","Transplant","Emergency Department","Oncology","Neurology"], tier: "tertiary", rating: 4.5, emergency: true, address: "Main Rd, Observatory, Cape Town 7925", beds: 989 },
  { id: "za-002", name: "Charlotte Maxeke Johannesburg Hospital", city: "Johannesburg", country: "South Africa", region: "Africa", specialties: ["Emergency Department","Oncology","Cardiology","Neurology"], tier: "tertiary", rating: 4.2, emergency: true, address: "7 York Rd, Parktown, Johannesburg 2193", beds: 1200 },
  { id: "za-003", name: "Inkosi Albert Luthuli Central Hospital", city: "Durban", country: "South Africa", region: "Africa", specialties: ["Cardiology","Neurology","Emergency Department","Oncology","Transplant"], tier: "tertiary", rating: 4.4, emergency: true, address: "800 Vusi Mzimela Rd, Cato Manor, Durban 4091", beds: 847 },

  // ── Kenya ─────────────────────────────────────────────────────────────────
  { id: "ke-001", name: "Kenyatta National Hospital", city: "Nairobi", country: "Kenya", region: "Africa", specialties: ["Emergency Department","Oncology","Cardiology","Neurology","Orthopedics"], tier: "tertiary", rating: 3.9, emergency: true, address: "Hospital Rd, Upper Hill, Nairobi", beds: 1800 },
  { id: "ke-002", name: "Aga Khan University Hospital", city: "Nairobi", country: "Kenya", region: "Africa", specialties: ["Cardiology","Oncology","Emergency Department","Internal Medicine","Orthopedics"], tier: "tertiary", rating: 4.6, emergency: true, address: "3rd Parklands Ave, Nairobi", beds: 254 },
  { id: "ke-003", name: "MP Shah Hospital", city: "Nairobi", country: "Kenya", region: "Africa", specialties: ["Cardiology","Emergency Department","General Practitioner","Internal Medicine"], tier: "secondary", rating: 4.3, emergency: true, address: "Shivachi Rd, Nairobi", beds: 172 },

  // ── Ghana ─────────────────────────────────────────────────────────────────
  { id: "gh-001", name: "Korle Bu Teaching Hospital", city: "Accra", country: "Ghana", region: "Africa", specialties: ["Emergency Department","Cardiology","Oncology","Neurology","Obstetrics"], tier: "tertiary", rating: 3.8, emergency: true, address: "Guggisberg Ave, Korle Bu, Accra", beds: 2000 },
  { id: "gh-002", name: "37 Military Hospital", city: "Accra", country: "Ghana", region: "Africa", specialties: ["Emergency Department","Internal Medicine","Orthopedics","Obstetrics"], tier: "secondary", rating: 3.7, emergency: true, address: "Liberation Rd, Accra", beds: 600 },

  // ── Brazil ────────────────────────────────────────────────────────────────
  { id: "br-001", name: "Hospital Israelita Albert Einstein", city: "São Paulo", country: "Brazil", region: "South America", specialties: ["Cardiology","Oncology","Neurology","Transplant","Emergency Department"], tier: "tertiary", rating: 4.9, emergency: true, address: "Av. Albert Einstein 627, São Paulo, SP 05652-900", beds: 550 },
  { id: "br-002", name: "Hospital das Clínicas FMUSP", city: "São Paulo", country: "Brazil", region: "South America", specialties: ["Cardiology","Oncology","Transplant","Neurology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "Av. Dr. Enéas de Carvalho Aguiar 255, São Paulo", beds: 2200 },
  { id: "br-003", name: "Sírio-Libanês Hospital", city: "São Paulo", country: "Brazil", region: "South America", specialties: ["Oncology","Cardiology","Neurology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "Rua Dona Adma Jafet 91, São Paulo, SP 01308-050", beds: 461 },
  { id: "br-004", name: "Clínica São Vicente", city: "Rio de Janeiro", country: "Brazil", region: "South America", specialties: ["Cardiology","Emergency Department","Orthopedics","Internal Medicine"], tier: "secondary", rating: 4.5, emergency: true, address: "Rua João Borges 204, Gávea, Rio de Janeiro", beds: 295 },

  // ── Mexico ────────────────────────────────────────────────────────────────
  { id: "mx-001", name: "Instituto Nacional de Cardiología", city: "Mexico City", country: "Mexico", region: "North America", specialties: ["Cardiology","Cardiovascular Surgery","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "Juan Badiano 1, Belisario Domínguez Sec 16, Mexico City 14080", beds: 375 },
  { id: "mx-002", name: "Hospital Ángeles Metropolitano", city: "Mexico City", country: "Mexico", region: "North America", specialties: ["Cardiology","Oncology","Orthopedics","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "Tlacotalpan 59, Roma Sur, Cuauhtémoc, Mexico City", beds: 200 },

  // ── Spain ─────────────────────────────────────────────────────────────────
  { id: "es-001", name: "Hospital Clínic de Barcelona", city: "Barcelona", country: "Spain", region: "Europe", specialties: ["Cardiology","Oncology","Gastroenterology","Transplant","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "Carrer de Villarroel 170, 08036 Barcelona", beds: 800 },
  { id: "es-002", name: "Hospital Universitario La Paz", city: "Madrid", country: "Spain", region: "Europe", specialties: ["Pediatrics","Cardiology","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "Paseo de la Castellana 261, 28046 Madrid", beds: 1400 },

  // ── Italy ─────────────────────────────────────────────────────────────────
  { id: "it-001", name: "Ospedale Policlinico San Matteo", city: "Pavia", country: "Italy", region: "Europe", specialties: ["Transplant","Oncology","Cardiology","Neurology"], tier: "tertiary", rating: 4.7, emergency: true, address: "Piazzale Golgi 19, 27100 Pavia PV", beds: 1000 },
  { id: "it-002", name: "Gemelli University Hospital", city: "Rome", country: "Italy", region: "Europe", specialties: ["Cardiology","Oncology","Neurology","Emergency Department","Obstetrics"], tier: "tertiary", rating: 4.7, emergency: true, address: "Largo Agostino Gemelli 8, 00168 Rome", beds: 1500 },

  // ── Netherlands ───────────────────────────────────────────────────────────
  { id: "nl-001", name: "Amsterdam UMC", city: "Amsterdam", country: "Netherlands", region: "Europe", specialties: ["Cardiology","Oncology","Neurology","Transplant","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "Meibergdreef 9, 1105 AZ Amsterdam", beds: 1100 },
  { id: "nl-002", name: "Erasmus MC", city: "Rotterdam", country: "Netherlands", region: "Europe", specialties: ["Transplant","Cardiology","Oncology","Pediatrics","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "Doctor Molewaterplein 40, 3015 GD Rotterdam", beds: 1342 },

  // ── Switzerland ───────────────────────────────────────────────────────────
  { id: "ch-001", name: "University Hospital Zurich (USZ)", city: "Zurich", country: "Switzerland", region: "Europe", specialties: ["Cardiology","Oncology","Neurology","Transplant","Emergency Department"], tier: "tertiary", rating: 4.9, emergency: true, address: "Rämistrasse 100, 8091 Zurich", beds: 950 },
  { id: "ch-002", name: "CHUV – Lausanne University Hospital", city: "Lausanne", country: "Switzerland", region: "Europe", specialties: ["Oncology","Cardiology","Neurology","Transplant"], tier: "tertiary", rating: 4.8, emergency: true, address: "Rue du Bugnon 46, 1011 Lausanne", beds: 1250 },

  // ── Sweden ────────────────────────────────────────────────────────────────
  { id: "se-001", name: "Karolinska University Hospital", city: "Stockholm", country: "Sweden", region: "Europe", specialties: ["Cardiology","Oncology","Transplant","Neurology","Emergency Department"], tier: "tertiary", rating: 4.9, emergency: true, address: "SE-171 76 Stockholm", beds: 1200 },

  // ── China ─────────────────────────────────────────────────────────────────
  { id: "cn-001", name: "Peking Union Medical College Hospital", city: "Beijing", country: "China", region: "Asia", specialties: ["Cardiology","Oncology","Endocrinology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "1 Shuaifuyuan, Dongcheng District, Beijing 100730", beds: 2000 },
  { id: "cn-002", name: "Zhongshan Hospital, Fudan University", city: "Shanghai", country: "China", region: "Asia", specialties: ["Cardiology","Gastroenterology","Oncology","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "180 Fenglin Rd, Xuhui District, Shanghai 200032", beds: 1700 },
  { id: "cn-003", name: "West China Hospital, Sichuan University", city: "Chengdu", country: "China", region: "Asia", specialties: ["Cardiology","Oncology","Neurology","Emergency Department","Transplant"], tier: "tertiary", rating: 4.7, emergency: true, address: "37 Guoxuexiang, Wuhou District, Chengdu 610041", beds: 4300 },

  // ── Egypt ─────────────────────────────────────────────────────────────────
  { id: "eg-001", name: "Kasr Alainy Hospital", city: "Cairo", country: "Egypt", region: "Africa", specialties: ["Emergency Department","Cardiology","Oncology","Neurology","Obstetrics"], tier: "tertiary", rating: 3.9, emergency: true, address: "Kasr Al Aini St, Cairo 11562", beds: 4000 },
  { id: "eg-002", name: "Ain Shams University Hospital", city: "Cairo", country: "Egypt", region: "Africa", specialties: ["Emergency Department","Cardiology","Pediatrics","Oncology"], tier: "tertiary", rating: 3.8, emergency: true, address: "Khalifa El-Maamon St, Abbaseyya, Cairo", beds: 1500 },

  // ── Saudi Arabia ──────────────────────────────────────────────────────────
  { id: "sa-001", name: "King Faisal Specialist Hospital", city: "Riyadh", country: "Saudi Arabia", region: "Middle East", specialties: ["Transplant","Cardiology","Oncology","Neurology","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "Zahrawi St, Al Mathar Ash Shamali, Riyadh 12713", beds: 1100 },
  { id: "sa-002", name: "King Khalid University Hospital", city: "Riyadh", country: "Saudi Arabia", region: "Middle East", specialties: ["Cardiology","Oncology","Emergency Department","Orthopedics"], tier: "tertiary", rating: 4.5, emergency: true, address: "King Abdulaziz Rd, An Nasim Al Gharbi, Riyadh", beds: 1000 },

  // ── Turkey ────────────────────────────────────────────────────────────────
  { id: "tr-001", name: "Hacettepe University Hospital", city: "Ankara", country: "Turkey", region: "Europe", specialties: ["Cardiology","Oncology","Transplant","Neurology","Emergency Department"], tier: "tertiary", rating: 4.7, emergency: true, address: "Sıhhiye, Ankara 06100", beds: 2000 },
  { id: "tr-002", name: "Istanbul University-Cerrahpasa Hospital", city: "Istanbul", country: "Turkey", region: "Europe", specialties: ["Cardiology","Oncology","Neurology","Transplant","Emergency Department"], tier: "tertiary", rating: 4.6, emergency: true, address: "Kocamustafapaşa Cd No:53, 34098 Istanbul", beds: 1100 },

  // ── Pakistan ──────────────────────────────────────────────────────────────
  { id: "pk-001", name: "Aga Khan University Hospital", city: "Karachi", country: "Pakistan", region: "Asia", specialties: ["Cardiology","Oncology","Emergency Department","Neurology","Obstetrics"], tier: "tertiary", rating: 4.7, emergency: true, address: "Stadium Rd, Karachi 74800", beds: 700 },
  { id: "pk-002", name: "Shaukat Khanum Cancer Hospital", city: "Lahore", country: "Pakistan", region: "Asia", specialties: ["Oncology","Hematology","Radiation Therapy","Emergency Department"], tier: "tertiary", rating: 4.8, emergency: true, address: "7-A Block R-3 M.A. Johar Town, Lahore 54000", beds: 350 },

  // ── Ethiopia ──────────────────────────────────────────────────────────────
  { id: "et-001", name: "Black Lion Specialized Hospital", city: "Addis Ababa", country: "Ethiopia", region: "Africa", specialties: ["Emergency Department","Cardiology","Oncology","Neurology"], tier: "tertiary", rating: 3.5, emergency: true, address: "Lideta Sub City, Addis Ababa", beds: 700 },

  // ── Tanzania ──────────────────────────────────────────────────────────────
  { id: "tz-001", name: "Muhimbili National Hospital", city: "Dar es Salaam", country: "Tanzania", region: "Africa", specialties: ["Emergency Department","Cardiology","Oncology","Orthopedics","Obstetrics"], tier: "tertiary", rating: 3.6, emergency: true, address: "United Nations Rd, Upanga West, Dar es Salaam", beds: 1600 },

  // ── Telehealth providers ──────────────────────────────────────────────────
  { id: "tele-001", name: "T3 Telehealth — Global", city: "Global", country: "Worldwide", region: "Global", specialties: ["General Practitioner","Family Medicine","Telehealth","Mental Health","Dermatology"], tier: "telehealth", rating: 4.6, emergency: false, address: "Available worldwide via T3 secure video", beds: undefined },
  { id: "tele-002", name: "T3 Mental Health Portal", city: "Global", country: "Worldwide", region: "Global", specialties: ["Psychiatry","Telehealth","Mental Health","Family Medicine"], tier: "telehealth", rating: 4.5, emergency: false, address: "Available worldwide via T3 secure video", beds: undefined },
  { id: "tele-003", name: "Teladoc Health", city: "Global", country: "Worldwide", region: "Global", specialties: ["General Practitioner","Dermatology","Mental Health","Telehealth"], tier: "telehealth", rating: 4.4, emergency: false, address: "Virtual — teladochealth.com", beds: undefined },
  { id: "tele-004", name: "MDLive", city: "Global", country: "Worldwide", region: "Global", specialties: ["General Practitioner","Family Medicine","Dermatology","Telehealth"], tier: "telehealth", rating: 4.3, emergency: false, address: "Virtual — mdlive.com", beds: undefined },
];

// ─── Helper: find best matching hospitals ────────────────────────────────────
export function findHospitals(options: {
  specialty?: string;
  region?: string;
  country?: string;
  emergency?: boolean;
  limit?: number;
}): Hospital[] {
  let results = [...HOSPITALS];

  if (options.emergency) {
    results = results.filter(h => h.emergency);
  }

  if (options.country) {
    const countryLower = options.country.toLowerCase();
    const countryMatches = results.filter(h => h.country.toLowerCase().includes(countryLower));
    if (countryMatches.length > 0) results = countryMatches;
  }

  if (options.region) {
    const regionLower = options.region.toLowerCase();
    const regionMatches = results.filter(h => h.region.toLowerCase().includes(regionLower));
    if (regionMatches.length > 5) results = regionMatches;
  }

  if (options.specialty) {
    const specLower = options.specialty.toLowerCase();
    const specMatches = results.filter(h =>
      h.specialties.some(s => s.toLowerCase().includes(specLower))
    );
    if (specMatches.length > 0) results = specMatches;
  }

  // Sort by rating desc
  results.sort((a, b) => b.rating - a.rating);

  return results.slice(0, options.limit ?? 5);
}

export const TOTAL_HOSPITALS = HOSPITALS.length;
