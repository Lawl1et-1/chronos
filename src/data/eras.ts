import type { Country } from '../lib/countries'

export interface Era {
  label: string
  start: number
  end: number
  /** Year the spiral jumps to when the era is picked. */
  focus: number
}

const e = (label: string, start: number, end: number, focus = start): Era => ({ label, start, end, focus })

/** Keyed by ISO 3166-1 numeric code, as used by world-atlas. */
const BY_COUNTRY: Record<string, Era[]> = {
  // France
  '250': [
    e('Gaule romaine', -58, 476, -52),
    e('Empire carolingien', 751, 843, 800),
    e('Guerre de Cent Ans', 1337, 1453, 1429),
    e('Guerres de religion', 1562, 1598, 1572),
    e('Révolution française', 1789, 1799),
    e('Empire napoléonien', 1804, 1815, 1805),
    e('Seconde Guerre mondiale', 1939, 1945, 1940),
    e("Guerre d'Algérie", 1954, 1962, 1958),
  ],
  // Allemagne
  '276': [
    e('Saint-Empire romain germanique', 962, 1250, 962),
    e('Réforme protestante', 1517, 1555, 1517),
    e('Guerre de Trente Ans', 1618, 1648, 1618),
    e('Unification allemande', 1864, 1871, 1871),
    e('République de Weimar', 1919, 1933, 1923),
    e('Troisième Reich', 1933, 1945, 1939),
    e('Division et guerre froide', 1949, 1989, 1961),
    e('Réunification', 1989, 1990, 1989),
  ],
  // Royaume-Uni
  '826': [
    e('Conquête normande', 1066, 1087, 1066),
    e('Magna Carta', 1215, 1215),
    e('Réforme anglicane', 1529, 1559, 1534),
    e('Guerres civiles anglaises', 1642, 1651, 1649),
    e('Révolution industrielle', 1760, 1840, 1769),
    e('Ère victorienne', 1837, 1901, 1857),
    e('Seconde Guerre mondiale', 1939, 1945, 1940),
    e('Décolonisation', 1947, 1997, 1947),
  ],
  // États-Unis
  '840': [
    e('Treize colonies', 1607, 1763, 1607),
    e('Révolution américaine', 1775, 1783, 1776),
    e("Expansion vers l'Ouest", 1803, 1848, 1803),
    e('Guerre de Sécession', 1861, 1865, 1861),
    e('Grande Dépression', 1929, 1939, 1929),
    e('Seconde Guerre mondiale', 1941, 1945, 1941),
    e('Droits civiques', 1954, 1968, 1963),
    e('Guerre froide', 1947, 1991, 1962),
  ],
  // Russie
  '643': [
    e('Rus de Kiev', 882, 1240, 988),
    e('Domination mongole', 1240, 1480, 1380),
    e('Ivan le Terrible', 1547, 1584, 1552),
    e('Pierre le Grand', 1682, 1725, 1703),
    e('Campagne de Russie', 1812, 1812),
    e('Révolution russe', 1917, 1922, 1917),
    e('Grande Guerre patriotique', 1941, 1945, 1941),
    e("Effondrement de l'URSS", 1985, 1991, 1991),
  ],
  // Chine
  '156': [
    e('Unification Qin', -221, -206, -221),
    e('Dynastie Han', -206, 220, -206),
    e('Dynastie Tang', 618, 907, 755),
    e('Dynastie Yuan', 1271, 1368, 1271),
    e('Dynastie Ming', 1368, 1644, 1405),
    e("Guerres de l'opium", 1839, 1860, 1839),
    e('Révolution Xinhai', 1911, 1912, 1911),
    e('République populaire', 1949, 1976, 1949),
    e('Réformes de Deng Xiaoping', 1978, 1992, 1978),
  ],
  // Japon
  '392': [
    e('Époque de Heian', 794, 1185, 794),
    e('Invasions mongoles', 1274, 1281, 1274),
    e('Époque Sengoku', 1467, 1603, 1600),
    e("Fermeture d'Edo", 1603, 1853, 1639),
    e('Restauration Meiji', 1868, 1912, 1868),
    e('Guerre du Pacifique', 1937, 1945, 1941),
    e('Miracle économique', 1955, 1990, 1964),
  ],
  // Inde
  '356': [
    e('Empire maurya', -322, -185, -268),
    e('Empire gupta', 320, 550, 380),
    e('Sultanat de Delhi', 1206, 1526, 1206),
    e('Empire moghol', 1526, 1857, 1556),
    e('Révolte des cipayes', 1857, 1858, 1857),
    e("Mouvement d'indépendance", 1919, 1947, 1930),
    e('Indépendance et partition', 1947, 1947),
  ],
  // Italie
  '380': [
    e('République romaine', -509, -27, -49),
    e("Chute de l'Empire d'Occident", 476, 476),
    e('Renaissance', 1400, 1550, 1494),
    e('Risorgimento', 1848, 1871, 1861),
    e('Fascisme', 1922, 1943, 1922),
    e('Seconde Guerre mondiale', 1940, 1945, 1943),
  ],
  // Espagne
  '724': [
    e('Al-Andalus', 711, 1492, 711),
    e('Fin de la Reconquista', 1492, 1492),
    e("Siècle d'or", 1516, 1648, 1588),
    e('Guerre de Succession', 1701, 1714, 1701),
    e("Guerre d'Espagne", 1936, 1939, 1936),
    e('Transition démocratique', 1975, 1982, 1975),
  ],
  // Portugal
  '620': [
    e('Grandes découvertes', 1415, 1543, 1498),
    e('Séisme de Lisbonne', 1755, 1755),
    e('Estado Novo', 1933, 1974, 1933),
    e('Révolution des Œillets', 1974, 1974),
  ],
  // Pays-Bas
  '528': [
    e('Révolte des Gueux', 1568, 1648, 1568),
    e("Siècle d'or néerlandais", 1588, 1672, 1602),
    e('Occupation allemande', 1940, 1945, 1940),
  ],
  // Pologne
  '616': [
    e('Baptême de la Pologne', 966, 966),
    e('République des Deux Nations', 1569, 1795, 1569),
    e('Partages de la Pologne', 1772, 1795, 1795),
    e('Indépendance', 1918, 1918),
    e('Seconde Guerre mondiale', 1939, 1945, 1939),
    e('Solidarność', 1980, 1989, 1980),
  ],
  // Ukraine
  '804': [
    e('Rus de Kiev', 882, 1240, 988),
    e('Hetmanat cosaque', 1648, 1764, 1648),
    e('Holodomor', 1932, 1933, 1932),
    e('Indépendance', 1991, 1991),
    e('Révolution de Maïdan', 2014, 2014),
  ],
  // Grèce
  '300': [
    e('Guerres médiques', -499, -449, -480),
    e('Guerre du Péloponnèse', -431, -404, -431),
    e('Alexandre le Grand', -336, -323, -334),
    e("Guerre d'indépendance", 1821, 1830, 1821),
    e('Occupation et guerre civile', 1941, 1949, 1941),
    e('Dictature des colonels', 1967, 1974, 1967),
  ],
  // Turquie
  '792': [
    e('Chute de Constantinople', 1453, 1453),
    e('Soliman le Magnifique', 1520, 1566, 1529),
    e('Siège de Vienne', 1683, 1683),
    e("Fin de l'Empire ottoman", 1914, 1922, 1915),
    e('République de Turquie', 1923, 1938, 1923),
  ],
  // Égypte
  '818': [
    e('Ancien Empire', -2686, -2181, -2560),
    e('Nouvel Empire', -1550, -1070, -1274),
    e('Égypte ptolémaïque', -332, -30, -31),
    e('Conquête arabe', 639, 642, 641),
    e("Expédition d'Égypte", 1798, 1801, 1798),
    e('Canal de Suez', 1859, 1869, 1869),
    e('Ère Nasser', 1952, 1970, 1956),
  ],
  // Iran
  '364': [
    e('Empire achéménide', -550, -330, -539),
    e('Empire sassanide', 224, 651, 260),
    e('Dynastie safavide', 1501, 1736, 1501),
    e('Révolution constitutionnelle', 1905, 1911, 1906),
    e("Coup d'État de 1953", 1953, 1953),
    e('Révolution islamique', 1979, 1979),
  ],
  // Irak
  '368': [
    e("Empire d'Akkad", -2334, -2154, -2334),
    e('Babylone de Hammurabi', -1792, -1750, -1792),
    e('Califat abbasside', 750, 1258, 762),
    e('Sac de Bagdad', 1258, 1258),
    e('Révolution de 1958', 1958, 1958),
    e('Guerre Iran-Irak', 1980, 1988, 1980),
    e('Invasion de 2003', 2003, 2003),
  ],
  // Arabie saoudite
  '682': [
    e("Débuts de l'islam", 610, 632, 622),
    e('Premier État saoudien', 1744, 1818, 1744),
    e('Fondation du royaume', 1932, 1932),
    e('Découverte du pétrole', 1938, 1938),
  ],
  // Israël
  '376': [
    e('Mandat britannique', 1920, 1948, 1920),
    e("Création de l'État d'Israël", 1948, 1949, 1948),
    e('Guerre des Six Jours', 1967, 1967),
    e('Guerre du Kippour', 1973, 1973),
    e("Accords d'Oslo", 1993, 1995, 1993),
  ],
  // Palestine
  '275': [
    e('Mandat britannique', 1920, 1948, 1920),
    e('Nakba', 1948, 1949, 1948),
    e('Guerre des Six Jours', 1967, 1967),
    e('Première Intifada', 1987, 1993, 1987),
    e("Accords d'Oslo", 1993, 1995, 1993),
  ],
  // Algérie
  '012': [
    e('Royaume de Numidie', -202, -46, -202),
    e('Conquête arabe', 670, 710, 682),
    e("Régence d'Alger", 1516, 1830, 1516),
    e('Conquête française', 1830, 1847, 1830),
    e("Guerre d'indépendance", 1954, 1962, 1954),
    e('Décennie noire', 1991, 2002, 1991),
  ],
  // Maroc
  '504': [
    e('Empire almohade', 1121, 1269, 1147),
    e('Bataille des Trois Rois', 1578, 1578),
    e('Protectorat', 1912, 1956, 1912),
    e('Indépendance', 1956, 1956),
    e('Marche verte', 1975, 1975),
  ],
  // Tunisie
  '788': [
    e('Carthage', -814, -146, -218),
    e('Destruction de Carthage', -146, -146),
    e('Fondation de Kairouan', 670, 670),
    e('Protectorat français', 1881, 1956, 1881),
    e('Indépendance', 1956, 1956),
    e('Révolution tunisienne', 2010, 2011, 2011),
  ],
  // Éthiopie
  '231': [
    e("Royaume d'Aksoum", 100, 940, 330),
    e("Bataille d'Adoua", 1896, 1896),
    e('Invasion italienne', 1935, 1941, 1935),
    e('Chute de Haïlé Sélassié', 1974, 1974),
  ],
  // Nigeria
  '566': [
    e('Califat de Sokoto', 1804, 1903, 1804),
    e('Colonie britannique', 1914, 1960, 1914),
    e('Indépendance', 1960, 1960),
    e('Guerre du Biafra', 1967, 1970, 1967),
  ],
  // Afrique du Sud
  '710': [
    e('Colonie du Cap', 1652, 1806, 1652),
    e('Guerres des Boers', 1899, 1902, 1899),
    e("Union d'Afrique du Sud", 1910, 1910),
    e('Apartheid', 1948, 1991, 1948),
    e("Fin de l'apartheid", 1990, 1994, 1994),
  ],
  // Corée du Sud
  '410': [
    e('Dynastie Joseon', 1392, 1897, 1446),
    e('Invasions japonaises', 1592, 1598, 1592),
    e('Annexion japonaise', 1910, 1945, 1910),
    e('Guerre de Corée', 1950, 1953, 1950),
    e('Démocratisation', 1987, 1987),
  ],
  // Vietnam
  '704': [
    e('Bataille de Bạch Đằng', 938, 938),
    e('Indochine française', 1887, 1954, 1887),
    e("Guerre d'Indochine", 1946, 1954, 1954),
    e('Guerre du Vietnam', 1955, 1975, 1968),
    e('Đổi Mới', 1986, 1986),
  ],
  // Brésil
  '076': [
    e('Colonisation portugaise', 1500, 1822, 1500),
    e('Indépendance', 1822, 1822),
    e("Abolition de l'esclavage", 1888, 1889, 1888),
    e('Ère Vargas', 1930, 1954, 1930),
    e('Dictature militaire', 1964, 1985, 1964),
  ],
  // Mexique
  '484': [
    e('Conquête espagnole', 1519, 1521, 1519),
    e("Guerre d'indépendance", 1810, 1821, 1810),
    e('Guerre américano-mexicaine', 1846, 1848, 1846),
    e('Révolution mexicaine', 1910, 1920, 1910),
  ],
  // Argentine
  '032': [
    e('Indépendance', 1816, 1816),
    e('Ère Perón', 1946, 1955, 1946),
    e('Dictature militaire', 1976, 1983, 1976),
    e('Guerre des Malouines', 1982, 1982),
  ],
  // Cuba
  '192': [
    e('Colonisation espagnole', 1511, 1898, 1511),
    e("Guerre d'indépendance", 1895, 1898, 1895),
    e('Révolution cubaine', 1959, 1959),
    e('Crise des missiles', 1962, 1962),
  ],
  // Canada
  '124': [
    e('Nouvelle-France', 1608, 1763, 1608),
    e('Conquête britannique', 1759, 1763, 1759),
    e('Confédération', 1867, 1867),
    e('Statut de Westminster', 1931, 1931),
    e('Révolution tranquille', 1960, 1970, 1960),
  ],
  // Australie
  '036': [
    e('Première Flotte', 1788, 1788),
    e("Ruée vers l'or", 1851, 1860, 1851),
    e('Fédération', 1901, 1901),
    e('Gallipoli', 1915, 1915),
  ],
}

type Region = 'europe' | 'mena' | 'africa' | 'asia' | 'americas' | 'oceania'

const BY_REGION: Record<Region, Era[]> = {
  europe: [
    e('Empire romain', -27, 476, 117),
    e('Croisades', 1095, 1291, 1095),
    e('Peste noire', 1347, 1351, 1347),
    e('Réformes religieuses', 1517, 1648, 1517),
    e('Printemps des peuples', 1848, 1849, 1848),
    e('Première Guerre mondiale', 1914, 1918, 1914),
    e('Seconde Guerre mondiale', 1939, 1945, 1939),
    e('Chute du mur de Berlin', 1989, 1991, 1989),
  ],
  mena: [
    e("Débuts de l'islam", 610, 661, 622),
    e('Califat abbasside', 750, 1258, 762),
    e('Croisades', 1095, 1291, 1187),
    e('Expansion ottomane', 1453, 1566, 1517),
    e('Décolonisation', 1945, 1962, 1956),
    e('Printemps arabes', 2010, 2012, 2011),
  ],
  africa: [
    e('Empire du Mali', 1235, 1600, 1324),
    e('Traite atlantique', 1500, 1867, 1660),
    e('Conférence de Berlin', 1884, 1885, 1884),
    e('Indépendances africaines', 1957, 1975, 1960),
    e('Fin de la guerre froide', 1989, 1994, 1989),
  ],
  asia: [
    e('Empire mongol', 1206, 1368, 1206),
    e('Colonisation européenne', 1800, 1945, 1858),
    e('Seconde Guerre mondiale', 1937, 1945, 1941),
    e('Décolonisation', 1945, 1975, 1947),
    e('Guerre froide en Asie', 1950, 1991, 1950),
  ],
  americas: [
    e('Maya classique', 250, 900, 800),
    e('Conquête européenne', 1492, 1600, 1492),
    e('Indépendances américaines', 1776, 1826, 1810),
    e('Guerre froide', 1947, 1991, 1962),
  ],
  oceania: [
    e('Voyages de Cook', 1768, 1779, 1770),
    e('Colonisation', 1788, 1900, 1840),
    e('Guerre du Pacifique', 1941, 1945, 1942),
    e('Décolonisation', 1962, 1980, 1970),
  ],
}

function regionOf([lat, lon]: [number, number]): Region {
  if (lon < -25) return 'americas'
  if (lon > 110 && lat < -10) return 'oceania'
  if (lat > 36 && lon < 45) return 'europe'
  if (lat > 12 && lon < 63) return 'mena'
  if (lon < 52) return 'africa'
  return 'asia'
}

export function erasFor(country: Country): Era[] {
  return (country.iso && BY_COUNTRY[country.iso]) || BY_REGION[regionOf(country.center)]
}
