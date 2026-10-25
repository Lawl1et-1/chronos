import type { KeyEventsResponse } from '../schemas'

/**
 * Demo data (CHRONOS_MOCK=1) so the interface can be developed without an API key.
 * Always Germany, 1939, whatever was asked — the response is flagged `demo`.
 */
export const DEMO_KEY_EVENTS: KeyEventsResponse = {
  demo: true,
  zone: { name: 'Allemagne', iso: '276', lat: 51.1, lon: 10.4 },
  year: 1939,
  period: { label: "L'Europe bascule dans la guerre", start: 1933, end: 1945 },
  context:
    "Depuis 1933, l'Allemagne est une dictature nazie qui réarme massivement. Après l'annexion de l'Autriche et des Sudètes en 1938 et les violences antisémites de la Nuit de cristal, 1939 voit le pays déclencher la Seconde Guerre mondiale en Europe.",
  events: [
    {
      id: 'publication-fission',
      title: 'Publication de la fission nucléaire',
      date: '6 janvier 1939',
      year: 1939,
      summary:
        "Otto Hahn et Fritz Strassmann publient la preuve que l'uranium bombardé de neutrons produit du baryum ; Lise Meitner et Otto Frisch en donnent l'interprétation : la fission du noyau.",
      whyItMattered:
        "La découverte montre qu'une réaction libérant une énergie considérable est possible. Les physiciens du monde entier comprennent aussitôt ses applications militaires potentielles.",
      longTermImpact:
        "Elle conduit au projet Manhattan, aux bombardements d'Hiroshima et de Nagasaki, puis à la dissuasion nucléaire et à l'énergie nucléaire civile qui structurent la seconde moitié du XXe siècle.",
      impactScore: 9,
      coordinates: { lat: 52.45, lon: 13.28 },
      possibleAlterations: [
        {
          title: 'Et si la publication avait été retardée ?',
          description:
            "Un examen plus lent ou une censure du régime aurait pu garder le résultat confidentiel quelques mois de plus.",
        },
        {
          title: "Et si le régime avait fait de l'uranium une priorité absolue ?",
          description:
            'Un premier groupe de travail sur l\'uranium existe dès avril 1939 ; il aurait pu recevoir des moyens bien supérieurs.',
        },
        {
          title: 'Et si Lise Meitner était restée isolée de ses collègues ?',
          description:
            "Exilée en Suède, elle échange encore avec Hahn par courrier ; sans ce lien, l'interprétation aurait pu tarder.",
        },
      ],
    },
    {
      id: 'occupation-boheme-moravie',
      title: 'Occupation de la Bohême-Moravie',
      date: '15 mars 1939',
      year: 1939,
      summary:
        "La Wehrmacht entre à Prague et transforme les terres tchèques en protectorat, au mépris des accords de Munich signés six mois plus tôt.",
      whyItMattered:
        "Pour la première fois, l'Allemagne annexe un territoire non germanophone. La politique d'apaisement de Londres et Paris perd toute crédibilité.",
      longTermImpact:
        "Le Royaume-Uni et la France garantissent alors l'indépendance de la Pologne, ce qui rend probable une guerre générale en cas de nouvelle agression.",
      impactScore: 7,
      coordinates: { lat: 50.09, lon: 14.42 },
      possibleAlterations: [
        {
          title: 'Et si le président Hácha avait refusé de capituler ?',
          description:
            "Convoqué à Berlin dans la nuit du 14 au 15 mars, il aurait pu ordonner une résistance malgré la perte des fortifications des Sudètes.",
        },
        {
          title: 'Et si Londres et Paris avaient réagi militairement ?',
          description:
            'Une mobilisation immédiate aurait été possible, même si les deux pays jugeaient leur réarmement insuffisant.',
        },
        {
          title: "Et si Hitler s'en était tenu aux accords de Munich ?",
          description:
            'Une partie de son entourage militaire redoutait encore une guerre jugée prématurée.',
        },
      ],
    },
    {
      id: 'pacte-germano-sovietique',
      title: 'Pacte germano-soviétique',
      date: '23 août 1939',
      year: 1939,
      summary:
        "Ribbentrop et Molotov signent à Moscou un pacte de non-agression, assorti d'un protocole secret qui partage l'Europe orientale en sphères d'influence.",
      whyItMattered:
        "L'Allemagne écarte le risque d'une guerre sur deux fronts et peut attaquer la Pologne. L'URSS obtient des territoires et du temps.",
      longTermImpact:
        "Le protocole secret prépare l'annexion des pays baltes et le partage de la Pologne ; sa rupture en juin 1941 ouvre le front de l'Est, le plus meurtrier de la guerre.",
      impactScore: 9,
      coordinates: { lat: 55.75, lon: 37.62 },
      possibleAlterations: [
        {
          title: "Et si l'alliance franco-britannique avec l'URSS avait abouti ?",
          description:
            "Des négociations militaires tripartites se tenaient à Moscou en août 1939 ; elles butaient notamment sur le passage des troupes soviétiques par la Pologne.",
        },
        {
          title: 'Et si Staline avait refusé de signer ?',
          description:
            'Le Kremlin hésitait entre les deux camps et pouvait préférer rester neutre sans accord.',
        },
        {
          title: 'Et si le protocole secret avait été divulgué aussitôt ?',
          description:
            "Sa publication aurait pu alerter les pays baltes et la Pologne sur le partage prévu de leurs territoires.",
        },
      ],
    },
    {
      id: 'invasion-pologne',
      title: 'Invasion de la Pologne',
      date: '1er septembre 1939',
      year: 1939,
      summary:
        "Après des provocations mises en scène à la frontière, l'Allemagne attaque la Pologne. L'Armée rouge envahit l'est du pays le 17 septembre.",
      whyItMattered:
        "Cette agression déclenche la Seconde Guerre mondiale en Europe. La Pologne est vaincue en quelques semaines et partagée entre ses deux voisins.",
      longTermImpact:
        "L'occupation s'accompagne aussitôt d'exécutions de masse et de persécutions ; la Pologne devient le principal lieu de la Shoah, et la guerre fait des dizaines de millions de morts.",
      impactScore: 10,
      coordinates: { lat: 54.41, lon: 18.67 },
      possibleAlterations: [
        {
          title: "Et si la France avait lancé une offensive d'envergure dans la Sarre ?",
          description:
            "L'offensive de septembre 1939 reste limitée alors que l'essentiel de l'armée allemande combat en Pologne.",
        },
        {
          title: "Et si l'URSS n'avait pas envahi l'est de la Pologne ?",
          description:
            "Le commandement polonais comptait sur un repli défensif vers le sud-est du pays.",
        },
        {
          title: "Et si l'attaque avait été reportée durablement ?",
          description:
            "Prévue le 26 août, elle est décalée au dernier moment après l'annonce de l'alliance anglo-polonaise.",
        },
      ],
    },
    {
      id: 'declarations-de-guerre',
      title: 'Le Royaume-Uni et la France déclarent la guerre',
      date: '3 septembre 1939',
      year: 1939,
      summary:
        "Faute de retrait allemand de Pologne, Londres puis Paris déclarent la guerre à l'Allemagne, à quelques heures d'intervalle.",
      whyItMattered:
        "Le conflit devient européen puis mondial, mais aucune offensive majeure n'est lancée à l'ouest : c'est la « drôle de guerre ».",
      longTermImpact:
        "La guerre redessine l'Europe : défaite de 1940, occupation, puis victoire alliée en 1945, partage du continent et début de la guerre froide.",
      impactScore: 9,
      coordinates: { lat: 51.5, lon: -0.13 },
      possibleAlterations: [
        {
          title: 'Et si Londres et Paris s\'étaient contentés de protestations ?',
          description:
            "Une partie des dirigeants restait attachée à l'apaisement et craignait une guerre longue.",
        },
        {
          title: 'Et si la conférence proposée par Mussolini avait eu lieu ?',
          description:
            "L'Italie propose une conférence de paix entre le 31 août et le 2 septembre ; Londres exige au préalable un retrait allemand.",
        },
        {
          title: 'Et si la France avait différé sa déclaration ?',
          description:
            "Paris, moins pressé que Londres, envisageait un délai supplémentaire avant d'entrer en guerre.",
        },
      ],
    },
  ],
}
