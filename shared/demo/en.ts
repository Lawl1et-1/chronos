import type { AlternateResponse, KeyEventsResponse } from '../schemas'

/** English version of the demo scenario (same ids and structure as the French one). */
export const DEMO_KEY_EVENTS_EN: KeyEventsResponse = {
  demo: true,
  zone: { name: 'Germany', iso: '276', lat: 51.1, lon: 10.4 },
  year: 1939,
  period: { label: 'Europe tips into war', start: 1933, end: 1945 },
  context:
    'Since 1933, Germany has been a Nazi dictatorship rearming on a massive scale. After the annexation of Austria and the Sudetenland in 1938 and the antisemitic violence of Kristallnacht, 1939 sees the country unleash the Second World War in Europe.',
  events: [
    {
      id: 'publication-fission',
      title: 'Nuclear fission is published',
      date: '6 January 1939',
      year: 1939,
      summary:
        'Otto Hahn and Fritz Strassmann publish proof that uranium bombarded with neutrons produces barium; Lise Meitner and Otto Frisch provide the interpretation: the nucleus splits.',
      whyItMattered:
        'The discovery shows that a reaction releasing enormous energy is possible. Physicists around the world immediately grasp its potential military uses.',
      longTermImpact:
        'It leads to the Manhattan Project, the bombings of Hiroshima and Nagasaki, then to nuclear deterrence and civilian nuclear power, which shape the second half of the twentieth century.',
      impactScore: 9,
      coordinates: { lat: 52.45, lon: 13.28 },
      possibleAlterations: [
        {
          title: 'What if publication had been delayed?',
          description: 'A slower review or censorship by the regime could have kept the result confidential for a few more months.',
        },
        {
          title: 'What if the regime had made uranium an absolute priority?',
          description: 'A first uranium working group existed from April 1939; it could have received far greater resources.',
        },
        {
          title: 'What if Lise Meitner had been cut off from her colleagues?',
          description: 'In exile in Sweden, she still corresponded with Hahn; without that link, the interpretation could have come later.',
        },
      ],
    },
    {
      id: 'occupation-boheme-moravie',
      title: 'Occupation of Bohemia and Moravia',
      date: '15 March 1939',
      year: 1939,
      summary:
        'The Wehrmacht enters Prague and turns the Czech lands into a protectorate, in defiance of the Munich Agreement signed six months earlier.',
      whyItMattered:
        'For the first time, Germany annexes a non-German-speaking territory. The appeasement policy of London and Paris loses all credibility.',
      longTermImpact:
        'The United Kingdom and France then guarantee Poland’s independence, which makes a general war likely in the event of a new aggression.',
      impactScore: 7,
      coordinates: { lat: 50.09, lon: 14.42 },
      possibleAlterations: [
        {
          title: 'What if President Hácha had refused to capitulate?',
          description:
            'Summoned to Berlin on the night of 14–15 March, he could have ordered resistance despite the loss of the Sudeten fortifications.',
        },
        {
          title: 'What if London and Paris had responded militarily?',
          description: 'Immediate mobilization was possible, even though both countries judged their rearmament insufficient.',
        },
        {
          title: 'What if Hitler had kept to the Munich Agreement?',
          description: 'Part of his military entourage still feared a war they considered premature.',
        },
      ],
    },
    {
      id: 'pacte-germano-sovietique',
      title: 'German–Soviet Pact',
      date: '23 August 1939',
      year: 1939,
      summary:
        'Ribbentrop and Molotov sign a non-aggression pact in Moscow, with a secret protocol dividing Eastern Europe into spheres of influence.',
      whyItMattered:
        'Germany removes the risk of a two-front war and can attack Poland. The USSR gains territory and time.',
      longTermImpact:
        'The secret protocol paves the way for the annexation of the Baltic states and the partition of Poland; its breach in June 1941 opens the Eastern Front, the deadliest of the war.',
      impactScore: 9,
      coordinates: { lat: 55.75, lon: 37.62 },
      possibleAlterations: [
        {
          title: 'What if the Franco-British alliance with the USSR had succeeded?',
          description:
            'Tripartite military talks were under way in Moscow in August 1939; they stalled notably over Soviet troops crossing Poland.',
        },
        {
          title: 'What if Stalin had refused to sign?',
          description: 'The Kremlin hesitated between the two camps and could have preferred to stay neutral without an agreement.',
        },
        {
          title: 'What if the secret protocol had been leaked at once?',
          description: 'Its publication could have warned the Baltic states and Poland of the planned division of their territory.',
        },
      ],
    },
    {
      id: 'invasion-pologne',
      title: 'Invasion of Poland',
      date: '1 September 1939',
      year: 1939,
      summary:
        'After staged provocations on the border, Germany attacks Poland. The Red Army invades the east of the country on 17 September.',
      whyItMattered:
        'This aggression starts the Second World War in Europe. Poland is defeated within weeks and partitioned between its two neighbours.',
      longTermImpact:
        'The occupation immediately brings mass executions and persecution; Poland becomes the main site of the Holocaust, and the war kills tens of millions of people.',
      impactScore: 10,
      coordinates: { lat: 54.41, lon: 18.67 },
      possibleAlterations: [
        {
          title: 'What if France had launched a large-scale offensive in the Saar?',
          description: 'The September 1939 offensive stays limited while most of the German army is fighting in Poland.',
        },
        {
          title: 'What if the USSR had not invaded eastern Poland?',
          description: 'The Polish command was counting on a defensive withdrawal to the south-east of the country.',
        },
        {
          title: 'What if the attack had been postponed for good?',
          description: 'Planned for 26 August, it was pushed back at the last minute after the Anglo-Polish alliance was announced.',
        },
      ],
    },
    {
      id: 'declarations-de-guerre',
      title: 'Britain and France declare war',
      date: '3 September 1939',
      year: 1939,
      summary:
        'With no German withdrawal from Poland, London and then Paris declare war on Germany, a few hours apart.',
      whyItMattered:
        'The conflict becomes European, then global, but no major offensive is launched in the west: this is the “Phoney War”.',
      longTermImpact:
        'The war redraws Europe: defeat in 1940, occupation, then Allied victory in 1945, the division of the continent and the start of the Cold War.',
      impactScore: 9,
      coordinates: { lat: 51.5, lon: -0.13 },
      possibleAlterations: [
        {
          title: 'What if London and Paris had settled for protests?',
          description: 'Some leaders remained attached to appeasement and feared a long war.',
        },
        {
          title: 'What if the conference proposed by Mussolini had taken place?',
          description:
            'Italy proposed a peace conference between 31 August and 2 September; London demanded a German withdrawal first.',
        },
        {
          title: 'What if France had delayed its declaration?',
          description: 'Paris, in less of a hurry than London, was considering a further delay before going to war.',
        },
      ],
    },
  ],
}

export const DEMO_ALTERNATE_EN: AlternateResponse = {
  demo: true,
  divergencePoint: {
    year: 1939,
    title: 'France launches a major offensive in the Saar',
    description:
      'In mid-September 1939, while most of the Wehrmacht is engaged in Poland, the French command commits some forty divisions against a still unfinished Siegfried Line, instead of the limited advance it actually carried out.',
  },
  butterflyEffects: [
    {
      cause: 'French breakthrough in the Saar during the Polish campaign',
      effect: 'The German high command has to recall divisions from the east in the middle of its offensive',
    },
    {
      cause: 'A two-front war from 1939',
      effect: 'German fuel and ammunition reserves, planned for a short war, run out quickly',
    },
    {
      cause: "Failure of Hitler's strategy in the eyes of the army",
      effect: 'The generals opposed to the war, already in contact in 1938–1939, see their chance to act',
    },
    {
      cause: 'Swift end of the Nazi regime',
      effect: 'Central Europe escapes both a prolonged German occupation and post-war Soviet domination',
    },
  ],
  timeline: [
    {
      year: 1939,
      title: 'The Siegfried Line is breached',
      description:
        'French troops cross the Saar and threaten the Rhineland. Berlin hastily pulls several divisions out of Poland to plug the western front, which clearly slows the campaign in the east.',
      realHistoryComparison:
        'In reality, the Saar offensive advances about eight kilometres and then stops; French troops withdraw in October without major fighting.',
      confidence: 0.7,
      affectedRegions: [
        { name: 'France', iso: '250' },
        { name: 'Germany', iso: '276' },
      ],
    },
    {
      year: 1939,
      title: 'Poland holds out in the south-east',
      description:
        'The Polish army keeps a pocket of resistance around Lwów. Seeing Germany in difficulty, Stalin delays the Red Army entry planned by the secret protocol.',
      realHistoryComparison:
        'In reality, the Red Army invades eastern Poland on 17 September and the last Polish units surrender in early October.',
      confidence: 0.55,
      affectedRegions: [
        { name: 'Poland', iso: '616' },
        { name: 'Ukraine', iso: '804' },
        { name: 'Russia', iso: '643' },
      ],
    },
    {
      year: 1940,
      title: 'Crisis at the top of the Reich',
      description:
        'Denied a quick victory and facing shortages, Hitler sees his authority challenged by part of the general staff, which had considered the war premature since 1938.',
      realHistoryComparison:
        'In reality, Germany invades Denmark and Norway, then defeats France in six weeks in May–June 1940.',
      confidence: 0.45,
      affectedRegions: [{ name: 'Germany', iso: '276' }],
    },
    {
      year: 1940,
      title: 'Military coup in Berlin',
      description:
        'A group of officers arrests the main Nazi leaders and forms a provisional government that asks for an armistice. The outcome remains fragile and the repression of regime supporters is violent.',
      realHistoryComparison:
        'In reality, the military plots against Hitler fail; the most important one, the 20 July 1944 attempt, is followed by bloody repression.',
      confidence: 0.35,
      affectedRegions: [{ name: 'Germany', iso: '276' }],
    },
    {
      year: 1941,
      title: 'Geneva peace conference',
      description:
        'The peace restores Poland and Czechoslovakia to their 1937 borders and imposes supervised disarmament on Germany. The antisemitic persecution already under way under the Nazi regime stops, without erasing the crimes committed since 1933.',
      realHistoryComparison:
        'In reality, the war spreads to the USSR in 1941; the systematic extermination of Europe’s Jews, the Holocaust, claims about six million victims.',
      confidence: 0.3,
      affectedRegions: [
        { name: 'Poland', iso: '616' },
        { name: 'Czechia', iso: '203' },
        { name: 'Slovakia', iso: '703' },
        { name: 'Germany', iso: '276' },
        { name: 'Switzerland', iso: '756' },
      ],
    },
    {
      year: 1945,
      title: 'No atomic bomb in 1945',
      description:
        'Without a world war, fission research moves at the pace of civilian laboratories. Nuclear weapons only appear later, in a context of rivalry between great powers.',
      realHistoryComparison: 'In reality, the United States bombs Hiroshima and Nagasaki in August 1945.',
      confidence: 0.3,
      affectedRegions: [
        { name: 'United States', iso: '840' },
        { name: 'Japan', iso: '392' },
      ],
    },
    {
      year: 1950,
      title: 'A Europe without an Iron Curtain',
      description:
        'The USSR, having stayed out of the European conflict, does not expand westward. Rivalry between the Soviet bloc and the democracies exists, but the border runs east of Poland.',
      realHistoryComparison:
        "In reality, Europe is cut in two by the Iron Curtain; Poland and Czechoslovakia become people's republics.",
      confidence: 0.25,
      affectedRegions: [
        { name: 'Poland', iso: '616' },
        { name: 'Czechia', iso: '203' },
        { name: 'Hungary', iso: '348' },
        { name: 'Russia', iso: '643' },
      ],
    },
    {
      year: 1957,
      title: 'A wider European community',
      description:
        'European economic integration brings together France, Germany, Italy and several Central European countries from the start, without the pressure of a direct Soviet threat.',
      realHistoryComparison:
        'In reality, the Treaty of Rome creates the six-member European Economic Community in 1957.',
      confidence: 0.2,
      affectedRegions: [
        { name: 'France', iso: '250' },
        { name: 'Germany', iso: '276' },
        { name: 'Italy', iso: '380' },
        { name: 'Poland', iso: '616' },
      ],
    },
    {
      year: 1965,
      title: 'Slower decolonization',
      description:
        'The French and British empires, less weakened, resist independence movements for longer. Colonial conflicts drag on, notably in North Africa and Asia.',
      realHistoryComparison:
        'In reality, India becomes independent in 1947 and Algeria in 1962; most African colonies gain independence around 1960.',
      confidence: 0.18,
      affectedRegions: [
        { name: 'India', iso: '356' },
        { name: 'Algeria', iso: '012' },
        { name: 'United Kingdom', iso: '826' },
        { name: 'France', iso: '250' },
      ],
    },
    {
      year: 2000,
      title: 'A Germany never divided',
      description:
        'Germany, still united but long marked by the 1933–1940 dictatorship, becomes a parliamentary democracy integrated into Europe. Its economic weight is comparable to the one it actually reached.',
      realHistoryComparison: 'In reality, Germany is divided from 1949 to 1990, then reunified on 3 October 1990.',
      confidence: 0.12,
      affectedRegions: [{ name: 'Germany', iso: '276' }],
    },
  ],
  worldIn2025:
    'In this timeline, the Europe of 2025 never went through the Second World War as we know it, nor the post-war division. The European Union has included Central Europe for decades, nuclear weapons appeared later, and the former colonial empires left deeper marks in Africa and Asia. The United States remains a great power, but plays a much smaller role in Europe.',
  plausibilityNote:
    'Several historians consider that in September 1939 the Siegfried Line was weakly defended and that a determined French offensive could have hurt Germany. But the French army’s defensive doctrine and slow mobilization made that choice unlikely. Beyond 1940, the scenario rests on a successful coup, a very fragile assumption: confidence drops sharply.',
}

export const DEMO_SUB_BRANCH_EN: AlternateResponse = {
  demo: true,
  divergencePoint: {
    year: 1940,
    title: "The generals' putsch fails",
    description:
      'In this timeline, the conspiring officers are betrayed before they can act. Hitler survives, the regime holds on and pursues a war already fought on two fronts since 1939.',
  },
  butterflyEffects: [
    {
      cause: 'Failure of the coup',
      effect: 'Massive purge of the general staff and tighter party control over the army',
    },
    {
      cause: 'Disorganized command on two fronts',
      effect: 'The German army wears itself out without a decisive victory in the west or the east',
    },
    {
      cause: 'Visible German military weakness',
      effect: 'The USSR decides to go to war to seize Central Europe',
    },
  ],
  timeline: [
    {
      year: 1940,
      title: 'The officers are purged',
      description:
        'The conspirators are arrested and executed. The regime steps up internal repression and puts loyalists at the head of the armies, at the expense of competence.',
      realHistoryComparison:
        'In reality, in May–June 1940, Germany invades the Netherlands, Belgium and France, which signs the armistice on 22 June.',
      confidence: 0.5,
      affectedRegions: [{ name: 'Germany', iso: '276' }],
    },
    {
      year: 1940,
      title: 'War of attrition on the Rhine',
      description:
        'The front freezes between the Saar and the Rhine. The Allied blockade deprives Germany of oil and metals, while French and British production speeds up.',
      realHistoryComparison:
        'In reality, the Battle of Britain pits the Luftwaffe against the Royal Air Force from July to October 1940.',
      confidence: 0.4,
      affectedRegions: [
        { name: 'France', iso: '250' },
        { name: 'Germany', iso: '276' },
        { name: 'United Kingdom', iso: '826' },
      ],
    },
    {
      year: 1941,
      title: 'The Red Army goes to war',
      description:
        'Seeing German weakness, Stalin breaks the pact and attacks westward to occupy Poland and the Baltic states before the Western Allies.',
      realHistoryComparison:
        'In reality, it is Germany that invades the USSR on 22 June 1941 (Operation Barbarossa).',
      confidence: 0.3,
      affectedRegions: [
        { name: 'Russia', iso: '643' },
        { name: 'Poland', iso: '616' },
        { name: 'Lithuania', iso: '440' },
      ],
    },
    {
      year: 1942,
      title: 'German military collapse',
      description:
        'Caught in a pincer, the Reich loses the Rhineland in the west and Silesia in the east. The regime collapses in the spring; its crimes, including the mass persecution already under way, are documented by the advancing armies.',
      realHistoryComparison:
        'In reality, Germany reaches its greatest extent in 1942; the Battle of Stalingrad begins in the summer.',
      confidence: 0.25,
      affectedRegions: [
        { name: 'Germany', iso: '276' },
        { name: 'Poland', iso: '616' },
      ],
    },
    {
      year: 1943,
      title: 'Germany occupied in two zones',
      description:
        'Allied and Soviet armies meet on the Elbe. The country is occupied, the west by the French and British, the east by the USSR.',
      realHistoryComparison:
        'In reality, Germany surrenders on 8 May 1945 and is divided into four occupation zones.',
      confidence: 0.2,
      affectedRegions: [
        { name: 'Germany', iso: '276' },
        { name: 'Russia', iso: '643' },
        { name: 'France', iso: '250' },
        { name: 'United Kingdom', iso: '826' },
      ],
    },
    {
      year: 1949,
      title: 'An Iron Curtain on the Elbe',
      description:
        'Two German states are born, as in reality but earlier, and Central Europe falls under Soviet influence. The United States, having stayed neutral, commits to Europe late.',
      realHistoryComparison: 'In reality, West and East Germany are founded in 1949, the year NATO is created.',
      confidence: 0.15,
      affectedRegions: [
        { name: 'Germany', iso: '276' },
        { name: 'United States', iso: '840' },
      ],
    },
    {
      year: 1956,
      title: 'A more fragile Western Europe',
      description:
        'Without a large Marshall Plan, rebuilding in the west is slower and France and the United Kingdom go into debt to stand up to the Soviet bloc.',
      realHistoryComparison: 'In reality, the Marshall Plan funds the reconstruction of Western Europe from 1948 to 1952.',
      confidence: 0.12,
      affectedRegions: [
        { name: 'France', iso: '250' },
        { name: 'United Kingdom', iso: '826' },
      ],
    },
    {
      year: 1990,
      title: 'Negotiated reunification',
      description:
        "As in reality, the economic weakening of the Soviet bloc leads to German reunification, after a division a few years longer.",
      realHistoryComparison: 'In reality, Germany is reunified on 3 October 1990.',
      confidence: 0.1,
      affectedRegions: [{ name: 'Germany', iso: '276' }],
    },
  ],
  worldIn2025:
    'In this sub-branch, the world of 2025 looks more like ours: a Europe divided for a long time, a Germany reunified late and a European Union born later. The United States plays a smaller role, and Western Europe went through a harder reconstruction.',
  plausibilityNote:
    'The scenario assumes the USSR breaks the 1939 pact to attack a weakened Germany, a debatable assumption given the state of the Red Army after the 1937–1938 purges. Confidence drops quickly after 1942.',
}
