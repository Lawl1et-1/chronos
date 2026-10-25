import type { AlternateResponse } from '../../shared/schemas'

/**
 * Demo scenario (CHRONOS_MOCK=1) for the "Invasion de la Pologne" demo event.
 * The alternate timeline is speculative; every "dans la réalité" comparison is factual.
 */
export const DEMO_ALTERNATE: AlternateResponse = {
  demo: true,
  divergencePoint: {
    year: 1939,
    title: 'La France lance une offensive majeure en Sarre',
    description:
      "Mi-septembre 1939, alors que l'essentiel de la Wehrmacht est engagé en Pologne, le commandement français engage une quarantaine de divisions contre une ligne Siegfried encore inachevée, au lieu de l'avancée limitée qu'il a réellement conduite.",
  },
  butterflyEffects: [
    {
      cause: "Percée française en Sarre pendant la campagne de Pologne",
      effect: "Le haut commandement allemand doit rappeler des divisions de l'Est en pleine offensive",
    },
    {
      cause: 'Guerre sur deux fronts dès 1939',
      effect: "Les réserves allemandes de carburant et de munitions, prévues pour une guerre courte, s'épuisent vite",
    },
    {
      cause: "Échec de la stratégie de Hitler aux yeux de l'armée",
      effect: "Les généraux opposés à la guerre, déjà en contact en 1938-1939, trouvent l'occasion d'agir",
    },
    {
      cause: 'Fin rapide du régime nazi',
      effect: "L'Europe centrale échappe à la fois à l'occupation allemande prolongée et à la domination soviétique d'après-guerre",
    },
  ],
  timeline: [
    {
      year: 1939,
      title: 'La ligne Siegfried percée',
      description:
        "Les troupes françaises franchissent la Sarre et menacent la Rhénanie. Berlin retire en hâte plusieurs divisions de Pologne pour colmater le front ouest, ce qui ralentit nettement la campagne à l'Est.",
      realHistoryComparison:
        "Dans la réalité, l'offensive de la Sarre progresse d'environ huit kilomètres puis s'arrête ; les troupes françaises se replient en octobre sans combat majeur.",
      confidence: 0.7,
      affectedRegions: [
        { name: 'France', iso: '250' },
        { name: 'Allemagne', iso: '276' },
      ],
    },
    {
      year: 1939,
      title: 'La Pologne résiste dans le sud-est',
      description:
        "L'armée polonaise conserve une poche de résistance autour de Lwów. Voyant l'Allemagne en difficulté, Staline retarde l'entrée de l'Armée rouge prévue par le protocole secret.",
      realHistoryComparison:
        "Dans la réalité, l'Armée rouge envahit l'est de la Pologne le 17 septembre et les dernières unités polonaises capitulent début octobre.",
      confidence: 0.55,
      affectedRegions: [
        { name: 'Pologne', iso: '616' },
        { name: 'Ukraine', iso: '804' },
        { name: 'Russie', iso: '643' },
      ],
    },
    {
      year: 1940,
      title: 'Crise au sommet du Reich',
      description:
        "Privé d'une victoire rapide et confronté à des pénuries, Hitler voit son autorité contestée par une partie de l'état-major, qui jugeait la guerre prématurée depuis 1938.",
      realHistoryComparison:
        "Dans la réalité, l'Allemagne envahit le Danemark, la Norvège, puis bat la France en six semaines en mai-juin 1940.",
      confidence: 0.45,
      affectedRegions: [{ name: 'Allemagne', iso: '276' }],
    },
    {
      year: 1940,
      title: "Coup d'État militaire à Berlin",
      description:
        "Un groupe d'officiers arrête les principaux dirigeants nazis et forme un gouvernement provisoire qui demande un armistice. L'issue reste fragile et la répression des partisans du régime est violente.",
      realHistoryComparison:
        "Dans la réalité, les complots militaires contre Hitler échouent ; le plus important, l'attentat du 20 juillet 1944, est suivi d'une répression sanglante.",
      confidence: 0.35,
      affectedRegions: [{ name: 'Allemagne', iso: '276' }],
    },
    {
      year: 1941,
      title: 'Conférence de paix de Genève',
      description:
        "La paix rétablit la Pologne et la Tchécoslovaquie dans leurs frontières de 1937 et impose un désarmement contrôlé à l'Allemagne. Les persécutions antisémites déjà engagées par le régime nazi cessent, sans effacer les crimes commis depuis 1933.",
      realHistoryComparison:
        "Dans la réalité, la guerre s'étend à l'URSS en 1941 ; l'extermination systématique des Juifs d'Europe, la Shoah, fait environ six millions de victimes.",
      confidence: 0.3,
      affectedRegions: [
        { name: 'Pologne', iso: '616' },
        { name: 'Tchéquie', iso: '203' },
        { name: 'Slovaquie', iso: '703' },
        { name: 'Allemagne', iso: '276' },
        { name: 'Suisse', iso: '756' },
      ],
    },
    {
      year: 1945,
      title: 'Pas de bombe atomique en 1945',
      description:
        "Sans guerre mondiale, les recherches sur la fission avancent au rythme des laboratoires civils. L'arme nucléaire n'apparaît que plus tard, dans un contexte de rivalité entre grandes puissances.",
      realHistoryComparison:
        "Dans la réalité, les États-Unis bombardent Hiroshima et Nagasaki en août 1945.",
      confidence: 0.3,
      affectedRegions: [
        { name: 'États-Unis', iso: '840' },
        { name: 'Japon', iso: '392' },
      ],
    },
    {
      year: 1950,
      title: 'Une Europe sans rideau de fer',
      description:
        "L'URSS, restée hors du conflit européen, ne s'étend pas vers l'ouest. La rivalité entre le bloc soviétique et les démocraties existe, mais la frontière passe à l'est de la Pologne.",
      realHistoryComparison:
        "Dans la réalité, l'Europe est coupée en deux par le rideau de fer ; la Pologne et la Tchécoslovaquie deviennent des démocraties populaires.",
      confidence: 0.25,
      affectedRegions: [
        { name: 'Pologne', iso: '616' },
        { name: 'Tchéquie', iso: '203' },
        { name: 'Hongrie', iso: '348' },
        { name: 'Russie', iso: '643' },
      ],
    },
    {
      year: 1957,
      title: 'Une communauté européenne élargie',
      description:
        "L'intégration économique européenne associe dès l'origine la France, l'Allemagne, l'Italie et plusieurs pays d'Europe centrale, sans la pression d'une menace soviétique directe.",
      realHistoryComparison:
        "Dans la réalité, le traité de Rome crée la Communauté économique européenne à six membres en 1957.",
      confidence: 0.2,
      affectedRegions: [
        { name: 'France', iso: '250' },
        { name: 'Allemagne', iso: '276' },
        { name: 'Italie', iso: '380' },
        { name: 'Pologne', iso: '616' },
      ],
    },
    {
      year: 1965,
      title: 'Une décolonisation plus lente',
      description:
        "Les empires français et britannique, moins affaiblis, résistent plus longtemps aux mouvements d'indépendance. Les conflits coloniaux se prolongent, notamment en Afrique du Nord et en Asie.",
      realHistoryComparison:
        "Dans la réalité, l'Inde devient indépendante en 1947 et l'Algérie en 1962 ; la plupart des colonies africaines accèdent à l'indépendance autour de 1960.",
      confidence: 0.18,
      affectedRegions: [
        { name: 'Inde', iso: '356' },
        { name: 'Algérie', iso: '012' },
        { name: 'Royaume-Uni', iso: '826' },
        { name: 'France', iso: '250' },
      ],
    },
    {
      year: 2000,
      title: 'Une Allemagne jamais divisée',
      description:
        "L'Allemagne, restée unie mais longtemps marquée par la dictature de 1933-1940, devient une démocratie parlementaire intégrée à l'Europe. Son poids économique est comparable à celui qu'elle a réellement atteint.",
      realHistoryComparison:
        "Dans la réalité, l'Allemagne est divisée de 1949 à 1990, puis réunifiée le 3 octobre 1990.",
      confidence: 0.12,
      affectedRegions: [{ name: 'Allemagne', iso: '276' }],
    },
  ],
  worldIn2025:
    "Dans cette chronologie, l'Europe de 2025 n'a pas connu la Seconde Guerre mondiale telle que nous la connaissons, ni la division de l'après-guerre. L'Union européenne inclut l'Europe centrale depuis des décennies, l'arme nucléaire est apparue plus tard, et les anciens empires coloniaux ont laissé des traces plus profondes en Afrique et en Asie. Les États-Unis restent une grande puissance, mais leur rôle en Europe est bien plus limité.",
  plausibilityNote:
    "Plusieurs historiens jugent qu'en septembre 1939, la ligne Siegfried était faiblement défendue et qu'une offensive française résolue aurait pu gêner l'Allemagne. Mais la doctrine défensive de l'armée française et la lenteur de sa mobilisation rendaient ce choix improbable. Au-delà de 1940, le scénario repose sur un coup d'État réussi, hypothèse très fragile : la confiance baisse fortement.",
}
