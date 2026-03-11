import { useState, useMemo, useEffect } from "react";

const PLATE_THICKNESSES = [9, 10, 12.5, 15, 25];
const FRD_TYPICAL = { 9: 0.17, 10: 0.17, 12.5: 0.20, 15: 0.20, 25: 0.43 };
const FRD_MAX = { 9: 0.20, 10: 0.20, 12.5: 0.25, 15: 0.25, 25: 0.65 };
const G = 9.81;

// GitHub Pages
const IMG_BASE = "https://martinm8266.github.io/Duebelrechner/img/Hohlraumduebel";

// Produktfoto je Produktname (relativer Pfad ab IMG_BASE)
// null = kein Bild vorhanden — SVG-Icon als Fallback
const PRODUCT_IMG = {
	// Fischer
	"GK (Kunststoff)": "Fischer/Fischer_GK.png",
	"GKM (Metall)": "Fischer/Fischer_Metall_GKM.png",
	"DuoBlade": "Fischer/Fischer_DuoBlade.png",
	"UX (Universal)": "Fischer/Fischer_KM.png",

	"HM M5": "Fischer/Fischer_HM.png",
	"HM M6": "Fischer/Fischer_HM.png",
	"KD/KDH (Kippdübel)": "Fischer/Fischer_KD.png",
	"DuoTec 10": "Fischer/Fischer_DuoTec.png",
	"DuoTec 12": "Fischer/Fischer_DuoTec.png",
	"DuoHM 4/5x55": "Fischer/Fischer_DuoHM.png",
	"DuoHM 6x55": "Fischer/Fischer_DuoHM.png",
	// Knauf
	"Metalldübel (GKM)": "Knauf/Knauf_Gipsplattenduebel.png",
	"Hartmut M5x60": "Knauf/Knauf_Hartmut.png",
	// Würth

	"SHARK Pro Ø6": "Wuerth/W-SHARK_PRO.png",
	"SHARK Pro Ø8": "Wuerth/W-SHARK_PRO.png",
	"W-GS Typ K": "Wuerth/W-SHARK_TWIST.png",
	"W-GS Metall (ZD)": "Wuerth/W-SHARK_TWIST.png",
	"W-HR M5": "Wuerth/W-HR.png",
	"W-HR M6": "Wuerth/W-HR.png",
	"W-HR M8": "Wuerth/W-HR.png",
	"W-MH M4": "Wuerth/W-MH.png",
	"W-MH M5": "Wuerth/W-MH.png",
	"W-MH M6": "Wuerth/W-MH.png",
	"W-KD (Kippdübel)": "Wuerth/W-KD-TB.png",
	// Hilti
	"HUD-1 (Kunststoff)": "Hilti/Hilti_HUD-1_Kunststoff.png",
	"HUD-2 (Universal)": "Hilti/Hilti_HUD-2-universal.png",
	"HUD-L (lang)": "Hilti/Hilti_HUD-L_Kunststoff_lang.png",
	"HGN (Nageldübel)": "Hilti/Hilti_HGN_Kunststoff.png",
	"HLD (Kunststoff)": "Hilti/Hilti_HLD_Kunststoff.png",
	"HFP (Nylon)": "Hilti/Hilti_HFP_Nylon.png",
	"HDD-S (Metall)": "Hilti/Hilti_HDD-S_Metall.png",
	"HSP (Metall)": "Hilti/Hilti_HSP_Metall.png",
	"HTB-3 (Kippdübel)": "Hilti/Hilti_HTB-3.png",
};

// ── Referenzdaten ─────────────────────────────────────────────────────────────
// Quellen: Fischer Befestigungskompass Plattenbaustoffe (PDF), Fischer Produktseiten,
//          Knauf Hartmut Datenblatt K543,
//          Würth: CL01_4505020202 (W-HR), CL01_4505020201 (W-MH), CL01_4507010101 (W-GS/K),
//                 CL01_4507020101 (W-GS/ZD), SHARK Pro Produktinfo; W-KD = Richtwert,
//          Hilti Katalog (*=Richtwert).
const REF_DATA = [
	// ── Fischer ──────────────────────────────────────────────────────────────
	{ hersteller: "Fischer", product: "GK (Kunststoff)", plate: "GKB 9,5 mm", fRd: 0.07 },
	{ hersteller: "Fischer", product: "GK (Kunststoff)", plate: "GKB 12,5 mm", fRd: 0.08 },
	{ hersteller: "Fischer", product: "GK (Kunststoff)", plate: "GKB 2x12,5 mm", fRd: 0.11 },
	{ hersteller: "Fischer", product: "GKM (Metall)", plate: "GKB 9,5 mm", fRd: 0.07 },
	{ hersteller: "Fischer", product: "GKM (Metall)", plate: "GKB 12,5 mm", fRd: 0.08 },
	{ hersteller: "Fischer", product: "GKM (Metall)", plate: "GKB 2x12,5 mm", fRd: 0.15 },
	{ hersteller: "Fischer", product: "GKM (Metall)", plate: "Gipsfaser 12,5", fRd: 0.20 },
	{ hersteller: "Fischer", product: "DuoBlade", plate: "GKB 9,5 mm", fRd: 0.08 },
	{ hersteller: "Fischer", product: "DuoBlade", plate: "GKB 12,5 mm", fRd: 0.10 },
	{ hersteller: "Fischer", product: "DuoBlade", plate: "Gipsfaser 12,5", fRd: 0.17 },
	{ hersteller: "Fischer", product: "UX (Universal)", plate: "GKB 12,5 mm", fRd: 0.08 },
	{ hersteller: "Fischer", product: "UX (Universal)", plate: "Gipsfaser 12,5", fRd: 0.10 },
	{ hersteller: "Fischer", product: "UX (Universal)", plate: "OSB / Spanpl.", fRd: 0.15 },

	{ hersteller: "Fischer", product: "HM M5", plate: "GKB 12,5 mm", fRd: 0.15 },
	{ hersteller: "Fischer", product: "HM M5", plate: "Gipsfaser 12,5", fRd: 0.25 },
	{ hersteller: "Fischer", product: "HM M6", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Fischer", product: "HM M6", plate: "Gipsfaser 12,5", fRd: 0.35 },
	{ hersteller: "Fischer", product: "HM M6", plate: "GKB 2x12,5 mm", fRd: 0.40 },
	{ hersteller: "Fischer", product: "KD/KDH (Kippdübel)", plate: "GKB 12,5 mm", fRd: 0.15 },
	{ hersteller: "Fischer", product: "KD/KDH (Kippdübel)", plate: "GKB 2x12,5 mm", fRd: 0.30 },
	{ hersteller: "Fischer", product: "KD/KDH (Kippdübel)", plate: "Gipsfaser 12,5", fRd: 0.25 },
	{ hersteller: "Fischer", product: "DuoTec 10", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Fischer", product: "DuoTec 10", plate: "GKB 2x12,5 mm", fRd: 0.40 },
	{ hersteller: "Fischer", product: "DuoTec 10", plate: "Gipsfaser 12,5", fRd: 0.35 },
	{ hersteller: "Fischer", product: "DuoTec 10", plate: "OSB / Spanpl.", fRd: 0.45 },
	{ hersteller: "Fischer", product: "DuoTec 12", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Fischer", product: "DuoTec 12", plate: "GKB 2x12,5 mm", fRd: 0.45 },
	{ hersteller: "Fischer", product: "DuoTec 12", plate: "Gipsfaser 12,5", fRd: 0.45 },
	{ hersteller: "Fischer", product: "DuoTec 12", plate: "OSB / Spanpl.", fRd: 0.60 },
	{ hersteller: "Fischer", product: "DuoHM 4/5x55", plate: "GKB 9,5 mm", fRd: 0.15 },
	{ hersteller: "Fischer", product: "DuoHM 6x55", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Fischer", product: "DuoHM 6x55", plate: "GKB 2x12,5 mm", fRd: 0.40 },
	{ hersteller: "Fischer", product: "DuoHM 6x55", plate: "Gipsfaser 12,5", fRd: 0.42 },
	{ hersteller: "Fischer", product: "DuoHM 6x55", plate: "OSB 15 mm", fRd: 0.56 },

	// ── Knauf ────────────────────────────────────────────────────────────────
	{ hersteller: "Knauf", product: "Metalldübel (GKM)", plate: "GKB 12,5 mm", fRd: 0.08 },
	{ hersteller: "Knauf", product: "Metalldübel (GKM)", plate: "Gipsfaser 12,5", fRd: 0.15 },
	{ hersteller: "Knauf", product: "Hartmut M5x60", plate: "GKB 12,5 mm", fRd: 0.40 },
	{ hersteller: "Knauf", product: "Hartmut M5x60", plate: "GKB 2x12,5 mm", fRd: 0.65 },
	{ hersteller: "Knauf", product: "Hartmut M5x60", plate: "Gipsfaser 12,5", fRd: 0.65 },

	// ── Würth ────────────────────────────────────────────────────────────────

	// SHARK Pro: Quelle Würth Produktinfo (verifiziert)
	{ hersteller: "Würth", product: "SHARK Pro Ø6", plate: "GKB 12,5 mm", fRd: 0.10 },
	{ hersteller: "Würth", product: "SHARK Pro Ø6", plate: "Gipsfaser 12,5", fRd: 0.20 },
	{ hersteller: "Würth", product: "SHARK Pro Ø8", plate: "GKB 12,5 mm", fRd: 0.10 },
	{ hersteller: "Würth", product: "SHARK Pro Ø8", plate: "Gipsfaser 12,5", fRd: 0.20 },
	// W-GS: Quelle Würth Datenblätter CL01_4507010101 + CL01_4507020101 (verifiziert)
	// Typ K (Kunststoff): F_Rd = min(N_empf, V_empf); kein Gipsfaser-Wert
	{ hersteller: "Würth", product: "W-GS Typ K", plate: "GKB 12,5 mm", fRd: 0.10 },
	{ hersteller: "Würth", product: "W-GS Typ K", plate: "GKB 2x12,5 mm", fRd: 0.10 },
	// Typ ZD (Zinkdruckguss): Gipsfaser zugelassen
	{ hersteller: "Würth", product: "W-GS Metall (ZD)", plate: "GKB 12,5 mm", fRd: 0.10 },
	{ hersteller: "Würth", product: "W-GS Metall (ZD)", plate: "GKB 2x12,5 mm", fRd: 0.10 },
	{ hersteller: "Würth", product: "W-GS Metall (ZD)", plate: "Gipsfaser 12,5", fRd: 0.12 },
	// W-HR: Quelle Würth Datenblatt CL01_4505020202 (verifiziert); M5=M6=M8 identisch
	// F_Rd = N_empf (maßgebend, konservativ)
	{ hersteller: "Würth", product: "W-HR M5", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Würth", product: "W-HR M5", plate: "GKB 2x12,5 mm", fRd: 0.40 },
	{ hersteller: "Würth", product: "W-HR M5", plate: "Gipsfaser 10 mm", fRd: 0.30 },
	{ hersteller: "Würth", product: "W-HR M6", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Würth", product: "W-HR M6", plate: "GKB 2x12,5 mm", fRd: 0.40 },
	{ hersteller: "Würth", product: "W-HR M6", plate: "Gipsfaser 10 mm", fRd: 0.30 },
	{ hersteller: "Würth", product: "W-HR M8", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Würth", product: "W-HR M8", plate: "GKB 2x12,5 mm", fRd: 0.40 },
	{ hersteller: "Würth", product: "W-HR M8", plate: "Gipsfaser 10 mm", fRd: 0.30 },
	// W-MH: Quelle Würth Datenblatt CL01_4505020201 (verifiziert); M4=M5=M6 identisch
	// kein M8 im Datenblatt; kein Gipsfaser-Wert
	{ hersteller: "Würth", product: "W-MH M4", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Würth", product: "W-MH M4", plate: "GKB 2x12,5 mm", fRd: 0.30 },
	{ hersteller: "Würth", product: "W-MH M4", plate: "OSB / Spanpl.", fRd: 0.25 },
	{ hersteller: "Würth", product: "W-MH M5", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Würth", product: "W-MH M5", plate: "GKB 2x12,5 mm", fRd: 0.30 },
	{ hersteller: "Würth", product: "W-MH M5", plate: "OSB / Spanpl.", fRd: 0.25 },
	{ hersteller: "Würth", product: "W-MH M6", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Würth", product: "W-MH M6", plate: "GKB 2x12,5 mm", fRd: 0.30 },
	{ hersteller: "Würth", product: "W-MH M6", plate: "OSB / Spanpl.", fRd: 0.25 },
	// W-KD: Richtwert — W-KDH Datenblatt enthält nur Bruchwerte, keine F_empf
	{ hersteller: "Würth", product: "W-KD (Kippdübel)", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Würth", product: "W-KD (Kippdübel)", plate: "GKB 2x12,5 mm", fRd: 0.40 },
	{ hersteller: "Würth", product: "W-KD (Kippdübel)", plate: "Gipsfaser 12,5", fRd: 0.30 },

	// ── Hilti (* = Richtwert, kein geprüftes Lastblatt) ──────────────────────
	{ hersteller: "Hilti", product: "HUD-1 (Kunststoff)", plate: "GKB 12,5 mm", fRd: 0.05 },
	{ hersteller: "Hilti", product: "HUD-2 (Universal)", plate: "GKB 9,5 mm", fRd: 0.05 },
	{ hersteller: "Hilti", product: "HUD-2 (Universal)", plate: "GKB 12,5 mm", fRd: 0.07 },
	{ hersteller: "Hilti", product: "HUD-L (lang)", plate: "GKB 12,5 mm", fRd: 0.08 },
	{ hersteller: "Hilti", product: "HGN (Nageldübel)", plate: "GKB 12,5 mm", fRd: 0.04 },
	{ hersteller: "Hilti", product: "HLD (Kunststoff)", plate: "GKB 12,5 mm", fRd: 0.08 },
	{ hersteller: "Hilti", product: "HFP (Nylon)", plate: "GKB 12,5 mm", fRd: 0.07 },
	{ hersteller: "Hilti", product: "HDD-S (Metall)", plate: "GKB 12,5 mm", fRd: 0.15 },
	{ hersteller: "Hilti", product: "HDD-S (Metall)", plate: "GKB 2x12,5 mm", fRd: 0.25 },
	{ hersteller: "Hilti", product: "HSP (Metall)", plate: "GKB 12,5 mm", fRd: 0.20 },
	{ hersteller: "Hilti", product: "HSP (Metall)", plate: "Gipsfaser 12,5", fRd: 0.30 },
	{ hersteller: "Hilti", product: "HTB-3 (Kippdübel)", plate: "GKB 12,5 mm", fRd: 0.15 },
	{ hersteller: "Hilti", product: "HTB-3 (Kippdübel)", plate: "GKB 2x12,5 mm", fRd: 0.30 },
	{ hersteller: "Hilti", product: "HTB-3 (Kippdübel)", plate: "Gipsfaser 12,5", fRd: 0.25 },
];

const HERSTELLER_COLOR = {
	Fischer: "#1a56db",
	Knauf: "#c2410c",
	Würth: "#b91c1c",
	Hilti: "#cc0000",
};
const HERSTELLER_BG = {
	Fischer: "#eff6ff",
	Knauf: "#fff7ed",
	Würth: "#fef2f2",
	Hilti: "#fff0f0",
};

const PRODUCT_TYPE = {
	"GK (Kunststoff)": "spiral",
	"GKM (Metall)": "spiral",
	"DuoBlade": "spiral",
	"UX (Universal)": "spiral",

	"HM M5": "metal-wing",
	"HM M6": "metal-wing",
	"KD/KDH (Kippdübel)": "flip",
	"DuoTec 10": "toggle",
	"DuoTec 12": "toggle",
	"DuoHM 4/5x55": "metal-wing",
	"DuoHM 6x55": "metal-wing",
	"Metalldübel (GKM)": "spiral",
	"Hartmut M5x60": "klapp-heavy",

	"SHARK Pro Ø6": "spiral",
	"SHARK Pro Ø8": "spiral",
	"W-GS (Kunststoff)": "spiral",
	"W-HR M5": "metal-wing",
	"W-HR M6": "metal-wing",
	"W-HR M8": "metal-wing",
	"W-MH M6": "klapp-heavy",
	"W-MH M8": "klapp-heavy",
	"W-KD (Kippdübel)": "flip",
	"HUD-1 (Kunststoff)": "spiral",
	"HUD-2 (Universal)": "spiral",
	"HUD-L (lang)": "spiral",
	"HGN (Nageldübel)": "spiral",
	"HLD (Kunststoff)": "spread",
	"HFP (Nylon)": "spiral",
	"HDD-S (Metall)": "metal-wing",
	"HSP (Metall)": "metal-wing",
	"HTB-3 (Kippdübel)": "flip",
};

function DuebelIcon({ type, color = "#1a56db", size = 60 }) {
	const s = size;
	const icons = {
		spiral: (
			<svg width={s} height={s} viewBox="0 0 72 72" fill="none">
				<rect x="10" y="4" width="18" height="44" rx="4" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" />
				<path d="M10 14 Q19 10 28 14 Q19 18 10 22 Q19 18 28 22 Q19 26 10 30 Q19 26 28 30 Q19 34 10 38 Q19 34 28 38 Q19 42 10 46" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
				<rect x="14" y="4" width="10" height="6" rx="2" fill={color} opacity="0.5" />
				<line x1="19" y1="48" x2="19" y2="66" stroke={color} strokeWidth="3" strokeLinecap="round" />
				<rect x="4" y="62" width="30" height="4" rx="2" fill={color} opacity="0.2" />
				<text x="36" y="52" fontSize="8" fill={color} opacity="0.5" fontFamily="monospace">GKB</text>
				<line x1="34" y1="4" x2="34" y2="68" stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
			</svg>
		),
		spread: (
			<svg width={s} height={s} viewBox="0 0 72 72" fill="none">
				<polygon points="26,8 46,8 50,40 22,40" fill={color} opacity="0.12" stroke={color} strokeWidth="1.5" />
				<line x1="36" y1="8" x2="36" y2="66" stroke={color} strokeWidth="3" strokeLinecap="round" />
				<path d="M22 40 L14 56 M50 40 L58 56" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
				<line x1="34" y1="4" x2="34" y2="68" stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />
				<rect x="4" y="62" width="30" height="4" rx="2" fill={color} opacity="0.2" />
				<circle cx="36" cy="8" r="4" fill={color} opacity="0.6" />
			</svg>
		),
		"metal-wing": (
			<svg width={s} height={s} viewBox="0 0 72 72" fill="none">
				<rect x="4" y="26" width="64" height="12" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1" strokeDasharray="4 2" />
				<rect x="30" y="8" width="12" height="56" rx="3" fill={color} opacity="0.18" stroke={color} strokeWidth="1.5" />
				<path d="M30 32 L8 22 L8 38 L30 38 Z" fill={color} opacity="0.35" stroke={color} strokeWidth="1.2" />
				<path d="M42 32 L64 22 L64 38 L42 38 Z" fill={color} opacity="0.35" stroke={color} strokeWidth="1.2" />
				<line x1="36" y1="8" x2="36" y2="12" stroke={color} strokeWidth="3" strokeLinecap="round" />
				<circle cx="36" cy="7" r="5" fill={color} opacity="0.5" />
			</svg>
		),
		flip: (
			<svg width={s} height={s} viewBox="0 0 72 72" fill="none">
				<rect x="4" y="28" width="64" height="10" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1" strokeDasharray="4 2" />
				<line x1="36" y1="4" x2="36" y2="68" stroke={color} strokeWidth="3" strokeLinecap="round" />
				<rect x="14" y="38" width="44" height="8" rx="4" fill={color} opacity="0.4" stroke={color} strokeWidth="1.2" />
				<line x1="36" y1="38" x2="14" y2="30" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
				<circle cx="36" cy="4" r="5" fill={color} opacity="0.6" />
				<rect x="32" y="4" width="8" height="10" rx="2" fill={color} opacity="0.3" />
			</svg>
		),
		"klapp-heavy": (
			<svg width={s} height={s} viewBox="0 0 72 72" fill="none">
				<rect x="4" y="26" width="64" height="14" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1" strokeDasharray="4 2" />
				<rect x="31" y="6" width="10" height="60" rx="3" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
				<path d="M10 40 Q10 52 20 56 L52 56 Q62 52 62 40" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
				<line x1="10" y1="40" x2="10" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
				<line x1="62" y1="40" x2="62" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
				<circle cx="36" cy="6" r="5" fill={color} opacity="0.6" />
			</svg>
		),
		toggle: (
			<svg width={s} height={s} viewBox="0 0 72 72" fill="none">
				<rect x="4" y="26" width="64" height="14" rx="2" fill={color} opacity="0.12" stroke={color} strokeWidth="1" strokeDasharray="4 2" />
				<rect x="31" y="6" width="10" height="60" rx="3" fill={color} opacity="0.2" stroke={color} strokeWidth="1.5" />
				<path d="M18 46 L36 40 L54 46 L54 56 L18 56 Z" fill={color} opacity="0.35" stroke={color} strokeWidth="1.2" />
				<line x1="18" y1="40" x2="18" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
				<line x1="54" y1="40" x2="54" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
				<circle cx="36" cy="6" r="5" fill={color} opacity="0.6" />
			</svg>
		),
		default: (
			<svg width={s} height={s} viewBox="0 0 72 72" fill="none">
				<circle cx="36" cy="36" r="28" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5" />
				<text x="36" y="41" fontSize="22" fill={color} opacity="0.5" textAnchor="middle" fontFamily="monospace">?</text>
			</svg>
		),
	};
	return icons[type] || icons.default;
}

// Produktbild mit automatischem SVG-Fallback
function ProductImage({ product, color, size = 60 }) {
	const imgPath = PRODUCT_IMG[product];
	const imgUrl = imgPath ? `${IMG_BASE}/${imgPath}` : null;
	const [err, setErr] = useState(false);
	useEffect(() => { setErr(false); }, [product]);

	if (imgUrl && !err) {
		return (
			<img
				src={imgUrl}
				alt={product}
				onError={() => setErr(true)}
				style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain", display: "block" }}
			/>
		);
	}
	return <DuebelIcon type={PRODUCT_TYPE[product] ?? "default"} color={color} size={size} />;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  input[type=range] { appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
  input[type=range]::-webkit-slider-thumb {
    appearance: none; width: 16px; height: 16px; border-radius: 50%;
    background: #1a56db; border: 2.5px solid #fff;
    box-shadow: 0 1px 4px rgba(26,86,219,0.35); cursor: pointer; transition: transform 0.15s;
  }
  input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
  input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #1a56db; border: 2.5px solid #fff; cursor: pointer; }
  input[type=text]:focus, input[type=number]:focus { outline: none; border-color: #1a56db !important; box-shadow: 0 0 0 3px rgba(26,86,219,0.12); }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 1; }
  select:focus { outline: none; border-color: #1a56db !important; box-shadow: 0 0 0 3px rgba(26,86,219,0.12); }
`;

function fmt(v, d) { return Number(v).toFixed(d); }
function toKg(kN) { return (kN * 1000 / G).toFixed(1); }

function getWarnings(plate, fRd) {
	const warnings = [];
	const max = FRD_MAX[plate];
	const typ = FRD_TYPICAL[plate];
	if (isNaN(fRd) || fRd <= 0) {
		warnings.push({ level: "error", text: "Bitte einen gültigen F_Rd-Wert eingeben (> 0 kN)." });
	} else if (fRd > max) {
		warnings.push({ level: "error", text: `F_Rd = ${fmt(fRd, 2)} kN überschreitet den realen Maximalwert für GKB ${plate} mm (Herstellermax: ${fmt(max, 2)} kN ≈ ${toKg(max)} kg).` });
	} else if (fRd > typ) {
		warnings.push({ level: "warn", text: `F_Rd = ${fmt(fRd, 2)} kN liegt über dem Richtwert für GKB ${plate} mm (${fmt(typ, 2)} kN). Gilt ggf. für Gipsfaser, Doppelbeplankung oder Schwerlastdübel.` });
	}
	return warnings;
}

function Card({ children, style = {} }) {
	return (
		<div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e9f0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: "1.6rem", ...style }}>
			{children}
		</div>
	);
}
function SectionTitle({ children }) {
	return (
		<div style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "1.3rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f0f2f5" }}>
			{children}
		</div>
	);
}
function FieldLabel({ children }) {
	return (
		<label style={{ display: "block", fontFamily: "'IBM Plex Sans'", fontSize: "0.78rem", fontWeight: 600, color: "#374151", marginBottom: "0.45rem" }}>
			{children}
		</label>
	);
}

const selectStyle = {
	width: "100%", padding: "0.55rem 0.8rem",
	border: "1.5px solid #e5e9f0", borderRadius: "7px",
	fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85rem",
	color: "#111827", background: "#fafbfc",
	cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
	appearance: "none",
	backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
	backgroundRepeat: "no-repeat", backgroundPosition: "right 0.7rem center", paddingRight: "2rem",
};

function DiscreteSlider({ label, unit, options, value, onChange }) {
	const idx = options.indexOf(value);
	const pct = (idx / (options.length - 1)) * 100;
	return (
		<div>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
				<FieldLabel>{label}</FieldLabel>
				<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.92rem", fontWeight: 600, color: "#1a56db" }}>
					{value}<span style={{ fontSize: "0.72rem", color: "#9ca3af", marginLeft: "0.25em", fontWeight: 400 }}>{unit}</span>
				</span>
			</div>
			<input type="range" min={0} max={options.length - 1} step={1} value={idx}
				onChange={(e) => onChange(options[parseInt(e.target.value)])}
				style={{ background: `linear-gradient(to right, #1a56db ${pct}%, #d1d9e6 ${pct}%)` }}
			/>
			<div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
				{options.map((o) => (
					<span key={o} onClick={() => onChange(o)} style={{
						fontFamily: "'IBM Plex Mono'", fontSize: "0.62rem",
						color: o === value ? "#1a56db" : "#c0c8d4",
						fontWeight: o === value ? 600 : 400, cursor: "pointer",
					}}>{o}</span>
				))}
			</div>
		</div>
	);
}

function WarningBox({ warnings }) {
	if (!warnings.length) return null;
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
			{warnings.map((w, i) => (
				<div key={i} style={{
					display: "flex", gap: "0.6rem", alignItems: "flex-start",
					padding: "0.6rem 0.8rem", borderRadius: "7px",
					background: w.level === "error" ? "#fef2f2" : "#fffbeb",
					border: `1px solid ${w.level === "error" ? "#fecaca" : "#fde68a"}`,
				}}>
					<span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{w.level === "error" ? "🚫" : "⚠️"}</span>
					<span style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.70rem", color: w.level === "error" ? "#b91c1c" : "#92400e", lineHeight: 1.5 }}>{w.text}</span>
				</div>
			))}
		</div>
	);
}

function ResultBlock({ label, valueKN, rows, accent, disabled }) {
	return (
		<div style={{
			flex: 1, background: disabled ? "#f9fafb" : "#f7f9fc", borderRadius: "10px",
			border: `1.5px solid ${disabled ? "#e5e9f0" : accent + "22"}`,
			borderTop: `3px solid ${disabled ? "#d1d5db" : accent}`,
			padding: "1.2rem",
		}}>
			<div style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.68rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.7rem" }}>{label}</div>
			{disabled ? (
				<div style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.8rem", color: "#9ca3af" }}>— ungültige Eingabe —</div>
			) : (
				<>
					<div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
						<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "2.1rem", fontWeight: 600, color: accent, lineHeight: 1 }}>
							{fmt(valueKN, 2)}<span style={{ fontSize: "0.85rem", color: `${accent}99`, marginLeft: "0.3em" }}>kN</span>
						</span>
						<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.78rem", color: "#9ca3af", background: "#eef2f7", borderRadius: "4px", padding: "0.15rem 0.45rem" }}>
							≈ {toKg(valueKN)} kg
						</span>
					</div>
					<div style={{ marginTop: "0.8rem", borderTop: "1px solid #e5e9f0", paddingTop: "0.6rem" }}>
						{rows.map(([k, v]) => (
							<div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.22rem" }}>
								<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.63rem", color: "#9ca3af" }}>{k}</span>
								<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.63rem", color: "#374151", fontWeight: 500 }}>{v}</span>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

function GaugeBar({ label, ratio }) {
	const pct = Math.min(ratio * 100, 100);
	const color = pct > 95 ? "#ef4444" : pct > 75 ? "#f59e0b" : "#16a34a";
	return (
		<div style={{ marginBottom: "0.85rem" }}>
			<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
				<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.65rem", color: "#6b7280" }}>{label}</span>
				<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.65rem", color, fontWeight: 600 }}>{pct.toFixed(1)} %</span>
			</div>
			<div style={{ height: "6px", background: "#edf0f5", borderRadius: "3px", overflow: "hidden" }}>
				<div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.35s ease" }} />
			</div>
		</div>
	);
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function DuebelCalculator() {
	const [name, setName] = useState("Fischer DuoHM 6x55");
	const [plate, setPlate] = useState(12.5);
	const [fRdInput, setFrdInput] = useState("0.20");

	const [selHersteller, setSelHersteller] = useState("Fischer");
	const [selProduct, setSelProduct] = useState("DuoHM 6x55");
	const [selPlate, setSelPlate] = useState("GKB 12,5 mm");

	const fRd = parseFloat(fRdInput.replace(",", "."));

	const herstellerList = useMemo(() => [...new Set(REF_DATA.map(r => r.hersteller))], []);
	const productList = useMemo(() => [...new Set(REF_DATA.filter(r => r.hersteller === selHersteller).map(r => r.product))], [selHersteller]);
	const plateList = useMemo(() => REF_DATA.filter(r => r.hersteller === selHersteller && r.product === selProduct).map(r => r.plate), [selHersteller, selProduct]);

	const handleHersteller = (h) => {
		setSelHersteller(h);
		const prods = [...new Set(REF_DATA.filter(r => r.hersteller === h).map(r => r.product))];
		const fp = prods[0];
		setSelProduct(fp);
		setSelPlate(REF_DATA.filter(r => r.hersteller === h && r.product === fp).map(r => r.plate)[0]);
	};
	const handleProduct = (p) => {
		setSelProduct(p);
		setSelPlate(REF_DATA.filter(r => r.hersteller === selHersteller && r.product === p).map(r => r.plate)[0]);
	};
	const handleApply = () => {
		const m = REF_DATA.find(r => r.hersteller === selHersteller && r.product === selProduct && r.plate === selPlate);
		if (m) { setFrdInput(fmt(m.fRd, 2)); setName(`${m.hersteller} ${m.product}`); }
	};

	const activeMatch = REF_DATA.find(r => r.hersteller === selHersteller && r.product === selProduct && r.plate === selPlate);
	const herColor = HERSTELLER_COLOR[selHersteller] ?? "#374151";
	const herBg = HERSTELLER_BG[selHersteller] ?? "#f7f9fc";
	const isHilti = selHersteller === "Hilti";

	const warnings = useMemo(() => getWarnings(plate, fRd), [plate, fRd]);
	const hasError = warnings.some(w => w.level === "error") || isNaN(fRd) || fRd <= 0;

	const calc = useMemo(() => {
		if (hasError) return null;
		const fWand = fRd / Math.sqrt(2);
		const fDecke = fRd;
		const nEd = fWand;
		const vEd = fWand;
		const eta = Math.sqrt(nEd ** 2 + vEd ** 2) / fRd;
		return { fWand, fDecke, nEd, vEd, eta };
	}, [fRd, hasError]);

	return (
		<div style={{ minHeight: "100vh", background: "#f0f2f5", padding: "2rem 1rem" }}>
			<style>{css}</style>

			<div style={{ maxWidth: "860px", margin: "0 auto 1.8rem" }}>
				<div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
					<div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "linear-gradient(135deg, #1a56db, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(26,86,219,0.3)", flexShrink: 0 }}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
						</svg>
					</div>
					<div>
						<h1 style={{ fontFamily: "'IBM Plex Sans'", fontSize: "1.4rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Dübelrechner</h1>
						<p style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.68rem", color: "#9ca3af", marginTop: "0.1rem" }}>Hohlraumdübel · Durchsteckmontage · Kombinierter Nennwert</p>
					</div>
				</div>
			</div>

			<div style={{ maxWidth: "860px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

				{/* ── Linke Spalte ── */}
				<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

					<Card>
						<SectionTitle>Produktauswahl</SectionTitle>

						<div style={{ marginBottom: "1rem" }}>
							<FieldLabel>Hersteller</FieldLabel>
							<select value={selHersteller} onChange={e => handleHersteller(e.target.value)} style={{ ...selectStyle, color: herColor, fontWeight: 600 }}>
								{herstellerList.map(h => <option key={h} value={h}>{h}</option>)}
							</select>
						</div>

						<div style={{ marginBottom: "1rem" }}>
							<FieldLabel>Produkt</FieldLabel>
							<select value={selProduct} onChange={e => handleProduct(e.target.value)} style={selectStyle}>
								{productList.map(p => <option key={p} value={p}>{p}</option>)}
							</select>
						</div>

						<div style={{ marginBottom: "1.2rem" }}>
							<FieldLabel>Baustoff / Plattenaufbau</FieldLabel>
							<select value={selPlate} onChange={e => setSelPlate(e.target.value)} style={selectStyle}>
								{plateList.map(p => <option key={p} value={p}>{p}</option>)}
							</select>
						</div>

						{activeMatch && (
							<div style={{ background: herBg, border: `1px solid ${herColor}33`, borderRadius: "8px", padding: "0.8rem 1rem", display: "flex", alignItems: "center", gap: "0.8rem" }}>
								<div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px", borderRadius: "8px", background: "#fff", border: `1px solid ${herColor}22`, overflow: "hidden" }}>
									<ProductImage product={selProduct} color={herColor} size={60} />
								</div>
								<div style={{ flex: 1 }}>
									<div style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.68rem", color: "#9ca3af", marginBottom: "0.15rem" }}>F_Rd laut Hersteller{isHilti ? " *" : ""}</div>
									<div style={{ fontFamily: "'IBM Plex Mono'", fontSize: "1.3rem", fontWeight: 700, color: herColor }}>
										{fmt(activeMatch.fRd, 2)} kN
										<span style={{ fontSize: "0.75rem", color: "#9ca3af", marginLeft: "0.5em", fontWeight: 400 }}>≈ {toKg(activeMatch.fRd)} kg</span>
									</div>
									<div style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.62rem", color: herColor, opacity: 0.7, marginTop: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
										{(PRODUCT_TYPE[selProduct] ?? "—").replace("-", " ")}
									</div>
								</div>
								<button onClick={handleApply} style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.75rem", fontWeight: 600, color: "#fff", background: herColor, border: "none", borderRadius: "7px", padding: "0.5rem 1rem", cursor: "pointer", transition: "opacity 0.15s", flexShrink: 0, alignSelf: "center" }}>
									↓ Übernehmen
								</button>
							</div>
						)}

						{isHilti && (
							<div style={{ marginTop: "0.6rem", padding: "0.45rem 0.7rem", borderRadius: "6px", background: "#fff8f8", border: "1px solid #fecaca", display: "flex", gap: "0.4rem" }}>
								<span style={{ fontSize: "0.72rem" }}>⚠️</span>
								<span style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.62rem", color: "#b91c1c", lineHeight: 1.4 }}>
									* Hilti-Werte sind Richtwerte — im konkreten Projekt Hilti PROFIS oder Produktdatenblatt verwenden.
								</span>
							</div>
						)}

						<p style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.60rem", color: "#9ca3af", marginTop: "0.7rem", lineHeight: 1.5 }}>
							Quellen: Fischer Befestigungskompass (PDF), Fischer Produktseiten, Knauf K543, Würth Produktdaten, Hilti Katalog (*). Im konkreten Projekt stets Herstellerdatenblatt heranziehen.
						</p>
					</Card>

					<Card>
						<SectionTitle>Bemessungseingaben</SectionTitle>

						<div style={{ marginBottom: "1.4rem" }}>
							<FieldLabel>Dübelbezeichnung</FieldLabel>
							<input type="text" value={name} onChange={e => setName(e.target.value)}
								style={{ width: "100%", padding: "0.55rem 0.8rem", border: "1.5px solid #e5e9f0", borderRadius: "7px", fontFamily: "'IBM Plex Mono'", fontSize: "0.85rem", color: "#111827", background: "#fafbfc", transition: "border-color 0.15s, box-shadow 0.15s" }}
							/>
						</div>

						<div style={{ marginBottom: "1.4rem" }}>
							<DiscreteSlider label="Plattendicke (GKB / GKF)" unit="mm" options={PLATE_THICKNESSES} value={plate} onChange={setPlate} />
						</div>

						<div>
							<FieldLabel>F_Rd — kombinierter Nennwert</FieldLabel>
							<div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
								<input type="number" value={fRdInput} onChange={e => setFrdInput(e.target.value)} step="0.01" min="0.01" max="2.00"
									style={{ width: "110px", padding: "0.55rem 0.8rem", border: "1.5px solid #e5e9f0", borderRadius: "7px", fontFamily: "'IBM Plex Mono'", fontSize: "1rem", fontWeight: 600, color: "#1a56db", background: "#fafbfc", transition: "border-color 0.15s, box-shadow 0.15s", textAlign: "right" }}
								/>
								<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.85rem", color: "#6b7280" }}>kN</span>
								{!isNaN(fRd) && fRd > 0 && (
									<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.78rem", color: "#9ca3af", background: "#eef2f7", borderRadius: "4px", padding: "0.2rem 0.5rem" }}>≈ {toKg(fRd)} kg</span>
								)}
							</div>
							<p style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.65rem", color: "#9ca3af", marginTop: "0.4rem" }}>
								Richtwert GKB {plate} mm: {fmt(FRD_TYPICAL[plate], 2)} kN · Max: {fmt(FRD_MAX[plate], 2)} kN
							</p>
						</div>
					</Card>
				</div>

				{/* ── Rechte Spalte ── */}
				<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

					{warnings.length > 0 && <WarningBox warnings={warnings} />}

					<Card>
						<SectionTitle>Ergebnisse</SectionTitle>

						<div style={{ background: "#f7f9fc", borderRadius: "7px", padding: "0.6rem 0.9rem", marginBottom: "1.2rem", border: "1px solid #e5e9f0", fontFamily: "'IBM Plex Mono'", fontSize: "0.72rem", color: "#6b7280" }}>
							{name || "—"} · GKB {plate} mm · F_Rd = {isNaN(fRd) ? "?" : fmt(fRd, 2)} kN
						</div>

						<div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.2rem" }}>
							<ResultBlock label="Konsolenlast (Wand)" valueKN={calc?.fWand ?? 0} accent="#1a56db" disabled={hasError}
								rows={[["Hebelarm a = h_ef", `${plate} mm`], ["a / h_ef", "1,000  (konstant)"], ["N_Ed = V_Ed", calc ? `${fmt(calc.nEd, 2)} kN` : "—"], ["= F_Rd / √2", calc ? `${fmt(fRd, 2)} / 1,414` : "—"]]}
							/>
							<ResultBlock label="Auszugskraft (Decke)" valueKN={calc?.fDecke ?? 0} accent="#0891b2" disabled={hasError}
								rows={[["Lastfall", "Reine Zuglast"], ["= F_Rd", calc ? `${fmt(fRd, 2)} kN` : "—"], ["Winkel α", "90°"], ["kein Moment", "—"]]}
							/>
						</div>

						<div style={{ background: "#f7f9fc", borderRadius: "8px", padding: "1rem 1.1rem", border: "1px solid #e5e9f0", opacity: hasError ? 0.35 : 1 }}>
							<div style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: "0.9rem" }}>Ausnutzung · Wandmontage</div>
							<GaugeBar label="N_Ed  (Zuganteil)" ratio={calc ? calc.nEd / fRd : 0} />
							<GaugeBar label="V_Ed  (Queranteil)" ratio={calc ? calc.vEd / fRd : 0} />
							<GaugeBar label="Resultierende / F_Rd  (≤ 1,0)" ratio={calc?.eta ?? 0} />
							{calc && (
								<>
									<div style={{ marginTop: "0.8rem", padding: "0.5rem 0.8rem", background: "#fff", borderRadius: "6px", border: "1px solid #e5e9f0", fontFamily: "'IBM Plex Mono'", fontSize: "0.7rem", color: "#374151" }}>
										√({fmt(calc.nEd, 2)}² + {fmt(calc.vEd, 2)}²) / {fmt(fRd, 2)} = <strong>{fmt(calc.eta, 3)}</strong>
									</div>
									<div style={{ marginTop: "0.7rem", padding: "0.6rem 0.9rem", borderRadius: "7px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "0.6rem" }}>
										<span>✅</span>
										<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.72rem", color: "#15803d", fontWeight: 600 }}>η = {fmt(calc.eta, 3)} ≤ 1,0 — Nachweis erfüllt</span>
									</div>
								</>
							)}
						</div>
					</Card>

					<Card style={{ background: "#f8faff", border: "1px solid #dbeafe" }}>
						<div style={{ fontFamily: "'IBM Plex Sans'", fontSize: "0.72rem", color: "#1e40af", lineHeight: 1.9 }}>
							<strong>Modell:</strong><br />
							<span style={{ fontFamily: "'IBM Plex Mono'", fontSize: "0.68rem", color: "#3b82f6" }}>
								F_Wand = F_Rd / √2  ≈  0,707 · F_Rd<br />
								F_Decke = F_Rd
							</span><br />
							<span style={{ fontSize: "0.68rem", color: "#6b7280" }}>
								Ankerpunkt an Plattenrückseite → a/h_ef = 1 (konstant).<br />
								Kein Ersatz für ingenieurtechnische Prüfung.
							</span>
						</div>
					</Card>

				</div>
			</div>
		</div>
	);
}