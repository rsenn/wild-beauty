const data = {
  links: [
    {
      source: "Napoleon",
      target: "Myriel",
      value: 1
    },
    {
      value: 8,
      target: "Myriel",
      source: "Mlle.Baptistine"
    },
    {
      target: "Myriel",
      value: 10,
      source: "Mme.Magloire"
    },
    {
      source: "Mme.Magloire",
      target: "Mlle.Baptistine",
      value: 6
    },
    {
      source: "CountessdeLo",
      value: 1,
      target: "Myriel"
    },
    {
      target: "Myriel",
      value: 1,
      source: "Geborand"
    },
    {
      value: 1,
      target: "Myriel",
      source: "Champtercier"
    },
    {
      value: 1,
      target: "Myriel",
      source: "Cravatte"
    },
    {
      value: 2,
      target: "Myriel",
      source: "Count"
    },
    {
      source: "OldMan",
      value: 1,
      target: "Myriel"
    },
    {
      value: 1,
      target: "Labarre",
      source: "Valjean"
    },
    {
      source: "Valjean",
      value: 3,
      target: "Mme.Magloire"
    },
    {
      value: 3,
      target: "Mlle.Baptistine",
      source: "Valjean"
    },
    {
      target: "Myriel",
      value: 5,
      source: "Valjean"
    },
    {
      source: "Marguerite",
      value: 1,
      target: "Valjean"
    },
    {
      source: "Mme.deR",
      target: "Valjean",
      value: 1
    },
    {
      target: "Valjean",
      value: 1,
      source: "Isabeau"
    },
    {
      target: "Valjean",
      value: 1,
      source: "Gervais"
    },
    {
      target: "Tholomyes",
      value: 4,
      source: "Listolier"
    },
    {
      value: 4,
      target: "Tholomyes",
      source: "Fameuil"
    },
    {
      source: "Fameuil",
      value: 4,
      target: "Listolier"
    },
    {
      source: "Blacheville",
      target: "Tholomyes",
      value: 4
    },
    {
      target: "Listolier",
      value: 4,
      source: "Blacheville"
    },
    {
      value: 4,
      target: "Fameuil",
      source: "Blacheville"
    },
    {
      target: "Tholomyes",
      value: 3,
      source: "Favourite"
    },
    {
      target: "Listolier",
      value: 3,
      source: "Favourite"
    },
    {
      value: 3,
      target: "Fameuil",
      source: "Favourite"
    },
    {
      value: 4,
      target: "Blacheville",
      source: "Favourite"
    },
    {
      target: "Tholomyes",
      value: 3,
      source: "Dahlia"
    },
    {
      target: "Listolier",
      value: 3,
      source: "Dahlia"
    },
    {
      target: "Fameuil",
      value: 3,
      source: "Dahlia"
    },
    {
      target: "Blacheville",
      value: 3,
      source: "Dahlia"
    },
    {
      source: "Dahlia",
      value: 5,
      target: "Favourite"
    },
    {
      source: "Zephine",
      value: 3,
      target: "Tholomyes"
    },
    {
      source: "Zephine",
      target: "Listolier",
      value: 3
    },
    {
      value: 3,
      target: "Fameuil",
      source: "Zephine"
    },
    {
      value: 3,
      target: "Blacheville",
      source: "Zephine"
    },
    {
      source: "Zephine",
      target: "Favourite",
      value: 4
    },
    {
      source: "Zephine",
      value: 4,
      target: "Dahlia"
    },
    {
      value: 3,
      target: "Tholomyes",
      source: "Fantine"
    },
    {
      value: 3,
      target: "Listolier",
      source: "Fantine"
    },
    {
      value: 3,
      target: "Fameuil",
      source: "Fantine"
    },
    {
      source: "Fantine",
      target: "Blacheville",
      value: 3
    },
    {
      value: 4,
      target: "Favourite",
      source: "Fantine"
    },
    {
      source: "Fantine",
      target: "Dahlia",
      value: 4
    },
    {
      source: "Fantine",
      target: "Zephine",
      value: 4
    },
    {
      target: "Marguerite",
      value: 2,
      source: "Fantine"
    },
    {
      source: "Fantine",
      target: "Valjean",
      value: 9
    },
    {
      target: "Fantine",
      value: 2,
      source: "Mme.Thenardier"
    },
    {
      source: "Mme.Thenardier",
      target: "Valjean",
      value: 7
    },
    {
      target: "Mme.Thenardier",
      value: 13,
      source: "Thenardier"
    },
    {
      source: "Thenardier",
      target: "Fantine",
      value: 1
    },
    {
      source: "Thenardier",
      value: 12,
      target: "Valjean"
    },
    {
      target: "Mme.Thenardier",
      value: 4,
      source: "Cosette"
    },
    {
      source: "Cosette",
      value: 31,
      target: "Valjean"
    },
    {
      source: "Cosette",
      target: "Tholomyes",
      value: 1
    },
    {
      target: "Thenardier",
      value: 1,
      source: "Cosette"
    },
    {
      source: "Javert",
      target: "Valjean",
      value: 17
    },
    {
      source: "Javert",
      value: 5,
      target: "Fantine"
    },
    {
      source: "Javert",
      value: 5,
      target: "Thenardier"
    },
    {
      value: 1,
      target: "Mme.Thenardier",
      source: "Javert"
    },
    {
      value: 1,
      target: "Cosette",
      source: "Javert"
    },
    {
      source: "Fauchelevent",
      target: "Valjean",
      value: 8
    },
    {
      target: "Javert",
      value: 1,
      source: "Fauchelevent"
    },
    {
      target: "Fantine",
      value: 1,
      source: "Bamatabois"
    },
    {
      source: "Bamatabois",
      value: 1,
      target: "Javert"
    },
    {
      target: "Valjean",
      value: 2,
      source: "Bamatabois"
    },
    {
      source: "Perpetue",
      target: "Fantine",
      value: 1
    },
    {
      source: "Simplice",
      value: 2,
      target: "Perpetue"
    },
    {
      source: "Simplice",
      target: "Valjean",
      value: 3
    },
    {
      value: 2,
      target: "Fantine",
      source: "Simplice"
    },
    {
      source: "Simplice",
      value: 1,
      target: "Javert"
    },
    {
      value: 1,
      target: "Valjean",
      source: "Scaufflaire"
    },
    {
      source: "Woman1",
      value: 2,
      target: "Valjean"
    },
    {
      value: 1,
      target: "Javert",
      source: "Woman1"
    },
    {
      source: "Judge",
      value: 3,
      target: "Valjean"
    },
    {
      value: 2,
      target: "Bamatabois",
      source: "Judge"
    },
    {
      source: "Champmathieu",
      target: "Valjean",
      value: 3
    },
    {
      value: 3,
      target: "Judge",
      source: "Champmathieu"
    },
    {
      target: "Bamatabois",
      value: 2,
      source: "Champmathieu"
    },
    {
      source: "Brevet",
      target: "Judge",
      value: 2
    },
    {
      target: "Champmathieu",
      value: 2,
      source: "Brevet"
    },
    {
      target: "Valjean",
      value: 2,
      source: "Brevet"
    },
    {
      value: 1,
      target: "Bamatabois",
      source: "Brevet"
    },
    {
      value: 2,
      target: "Judge",
      source: "Chenildieu"
    },
    {
      source: "Chenildieu",
      target: "Champmathieu",
      value: 2
    },
    {
      source: "Chenildieu",
      target: "Brevet",
      value: 2
    },
    {
      value: 2,
      target: "Valjean",
      source: "Chenildieu"
    },
    {
      target: "Bamatabois",
      value: 1,
      source: "Chenildieu"
    },
    {
      target: "Judge",
      value: 2,
      source: "Cochepaille"
    },
    {
      source: "Cochepaille",
      value: 2,
      target: "Champmathieu"
    },
    {
      source: "Cochepaille",
      value: 2,
      target: "Brevet"
    },
    {
      source: "Cochepaille",
      target: "Chenildieu",
      value: 2
    },
    {
      source: "Cochepaille",
      target: "Valjean",
      value: 2
    },
    {
      target: "Bamatabois",
      value: 1,
      source: "Cochepaille"
    },
    {
      source: "Pontmercy",
      target: "Thenardier",
      value: 1
    },
    {
      source: "Boulatruelle",
      value: 1,
      target: "Thenardier"
    },
    {
      value: 2,
      target: "Mme.Thenardier",
      source: "Eponine"
    },
    {
      target: "Thenardier",
      value: 3,
      source: "Eponine"
    },
    {
      source: "Anzelma",
      value: 2,
      target: "Eponine"
    },
    {
      source: "Anzelma",
      value: 2,
      target: "Thenardier"
    },
    {
      source: "Anzelma",
      target: "Mme.Thenardier",
      value: 1
    },
    {
      value: 3,
      target: "Valjean",
      source: "Woman2"
    },
    {
      source: "Woman2",
      value: 1,
      target: "Cosette"
    },
    {
      value: 1,
      target: "Javert",
      source: "Woman2"
    },
    {
      value: 3,
      target: "Fauchelevent",
      source: "MotherInnocent"
    },
    {
      source: "MotherInnocent",
      target: "Valjean",
      value: 1
    },
    {
      value: 2,
      target: "Fauchelevent",
      source: "Gribier"
    },
    {
      target: "Jondrette",
      value: 1,
      source: "Mme.Burgon"
    },
    {
      target: "Mme.Burgon",
      value: 2,
      source: "Gavroche"
    },
    {
      source: "Gavroche",
      target: "Thenardier",
      value: 1
    },
    {
      source: "Gavroche",
      target: "Javert",
      value: 1
    },
    {
      target: "Valjean",
      value: 1,
      source: "Gavroche"
    },
    {
      source: "Gillenormand",
      target: "Cosette",
      value: 3
    },
    {
      source: "Gillenormand",
      target: "Valjean",
      value: 2
    },
    {
      target: "Gillenormand",
      value: 1,
      source: "Magnon"
    },
    {
      value: 1,
      target: "Mme.Thenardier",
      source: "Magnon"
    },
    {
      source: "Mlle.Gillenormand",
      target: "Gillenormand",
      value: 9
    },
    {
      source: "Mlle.Gillenormand",
      value: 2,
      target: "Cosette"
    },
    {
      source: "Mlle.Gillenormand",
      target: "Valjean",
      value: 2
    },
    {
      source: "Mme.Pontmercy",
      target: "Mlle.Gillenormand",
      value: 1
    },
    {
      target: "Pontmercy",
      value: 1,
      source: "Mme.Pontmercy"
    },
    {
      value: 1,
      target: "Mlle.Gillenormand",
      source: "Mlle.Vaubois"
    },
    {
      value: 2,
      target: "Mlle.Gillenormand",
      source: "Lt.Gillenormand"
    },
    {
      value: 1,
      target: "Gillenormand",
      source: "Lt.Gillenormand"
    },
    {
      value: 1,
      target: "Cosette",
      source: "Lt.Gillenormand"
    },
    {
      target: "Mlle.Gillenormand",
      value: 6,
      source: "Marius"
    },
    {
      source: "Marius",
      target: "Gillenormand",
      value: 12
    },
    {
      target: "Pontmercy",
      value: 1,
      source: "Marius"
    },
    {
      value: 1,
      target: "Lt.Gillenormand",
      source: "Marius"
    },
    {
      source: "Marius",
      target: "Cosette",
      value: 21
    },
    {
      target: "Valjean",
      value: 19,
      source: "Marius"
    },
    {
      value: 1,
      target: "Tholomyes",
      source: "Marius"
    },
    {
      source: "Marius",
      target: "Thenardier",
      value: 2
    },
    {
      source: "Marius",
      value: 5,
      target: "Eponine"
    },
    {
      source: "Marius",
      value: 4,
      target: "Gavroche"
    },
    {
      value: 1,
      target: "Gillenormand",
      source: "BaronessT"
    },
    {
      source: "BaronessT",
      value: 1,
      target: "Marius"
    },
    {
      source: "Mabeuf",
      value: 1,
      target: "Marius"
    },
    {
      source: "Mabeuf",
      value: 1,
      target: "Eponine"
    },
    {
      source: "Mabeuf",
      value: 1,
      target: "Gavroche"
    },
    {
      source: "Enjolras",
      target: "Marius",
      value: 7
    },
    {
      value: 7,
      target: "Gavroche",
      source: "Enjolras"
    },
    {
      source: "Enjolras",
      target: "Javert",
      value: 6
    },
    {
      target: "Mabeuf",
      value: 1,
      source: "Enjolras"
    },
    {
      target: "Valjean",
      value: 4,
      source: "Enjolras"
    },
    {
      source: "Combeferre",
      target: "Enjolras",
      value: 15
    },
    {
      value: 5,
      target: "Marius",
      source: "Combeferre"
    },
    {
      source: "Combeferre",
      value: 6,
      target: "Gavroche"
    },
    {
      target: "Mabeuf",
      value: 2,
      source: "Combeferre"
    },
    {
      target: "Gavroche",
      value: 1,
      source: "Prouvaire"
    },
    {
      value: 4,
      target: "Enjolras",
      source: "Prouvaire"
    },
    {
      target: "Combeferre",
      value: 2,
      source: "Prouvaire"
    },
    {
      target: "Gavroche",
      value: 2,
      source: "Feuilly"
    },
    {
      value: 6,
      target: "Enjolras",
      source: "Feuilly"
    },
    {
      value: 2,
      target: "Prouvaire",
      source: "Feuilly"
    },
    {
      target: "Combeferre",
      value: 5,
      source: "Feuilly"
    },
    {
      target: "Mabeuf",
      value: 1,
      source: "Feuilly"
    },
    {
      target: "Marius",
      value: 1,
      source: "Feuilly"
    },
    {
      target: "Marius",
      value: 9,
      source: "Courfeyrac"
    },
    {
      value: 17,
      target: "Enjolras",
      source: "Courfeyrac"
    },
    {
      value: 13,
      target: "Combeferre",
      source: "Courfeyrac"
    },
    {
      target: "Gavroche",
      value: 7,
      source: "Courfeyrac"
    },
    {
      source: "Courfeyrac",
      value: 2,
      target: "Mabeuf"
    },
    {
      value: 1,
      target: "Eponine",
      source: "Courfeyrac"
    },
    {
      target: "Feuilly",
      value: 6,
      source: "Courfeyrac"
    },
    {
      value: 3,
      target: "Prouvaire",
      source: "Courfeyrac"
    },
    {
      value: 5,
      target: "Combeferre",
      source: "Bahorel"
    },
    {
      source: "Bahorel",
      value: 5,
      target: "Gavroche"
    },
    {
      source: "Bahorel",
      value: 6,
      target: "Courfeyrac"
    },
    {
      target: "Mabeuf",
      value: 2,
      source: "Bahorel"
    },
    {
      source: "Bahorel",
      value: 4,
      target: "Enjolras"
    },
    {
      source: "Bahorel",
      target: "Feuilly",
      value: 3
    },
    {
      target: "Prouvaire",
      value: 2,
      source: "Bahorel"
    },
    {
      source: "Bahorel",
      target: "Marius",
      value: 1
    },
    {
      target: "Marius",
      value: 5,
      source: "Bossuet"
    },
    {
      target: "Courfeyrac",
      value: 12,
      source: "Bossuet"
    },
    {
      source: "Bossuet",
      target: "Gavroche",
      value: 5
    },
    {
      source: "Bossuet",
      target: "Bahorel",
      value: 4
    },
    {
      target: "Enjolras",
      value: 10,
      source: "Bossuet"
    },
    {
      value: 6,
      target: "Feuilly",
      source: "Bossuet"
    },
    {
      target: "Prouvaire",
      value: 2,
      source: "Bossuet"
    },
    {
      source: "Bossuet",
      value: 9,
      target: "Combeferre"
    },
    {
      source: "Bossuet",
      target: "Mabeuf",
      value: 1
    },
    {
      target: "Valjean",
      value: 1,
      source: "Bossuet"
    },
    {
      source: "Joly",
      target: "Bahorel",
      value: 5
    },
    {
      value: 7,
      target: "Bossuet",
      source: "Joly"
    },
    {
      source: "Joly",
      value: 3,
      target: "Gavroche"
    },
    {
      source: "Joly",
      value: 5,
      target: "Courfeyrac"
    },
    {
      value: 5,
      target: "Enjolras",
      source: "Joly"
    },
    {
      source: "Joly",
      target: "Feuilly",
      value: 5
    },
    {
      target: "Prouvaire",
      value: 2,
      source: "Joly"
    },
    {
      target: "Combeferre",
      value: 5,
      source: "Joly"
    },
    {
      value: 1,
      target: "Mabeuf",
      source: "Joly"
    },
    {
      source: "Joly",
      target: "Marius",
      value: 2
    },
    {
      target: "Bossuet",
      value: 3,
      source: "Grantaire"
    },
    {
      value: 3,
      target: "Enjolras",
      source: "Grantaire"
    },
    {
      target: "Combeferre",
      value: 1,
      source: "Grantaire"
    },
    {
      source: "Grantaire",
      value: 2,
      target: "Courfeyrac"
    },
    {
      source: "Grantaire",
      value: 2,
      target: "Joly"
    },
    {
      value: 1,
      target: "Gavroche",
      source: "Grantaire"
    },
    {
      source: "Grantaire",
      value: 1,
      target: "Bahorel"
    },
    {
      source: "Grantaire",
      value: 1,
      target: "Feuilly"
    },
    {
      source: "Grantaire",
      value: 1,
      target: "Prouvaire"
    },
    {
      value: 3,
      target: "Mabeuf",
      source: "MotherPlutarch"
    },
    {
      target: "Thenardier",
      value: 5,
      source: "Gueulemer"
    },
    {
      value: 1,
      target: "Valjean",
      source: "Gueulemer"
    },
    {
      source: "Gueulemer",
      target: "Mme.Thenardier",
      value: 1
    },
    {
      target: "Javert",
      value: 1,
      source: "Gueulemer"
    },
    {
      source: "Gueulemer",
      target: "Gavroche",
      value: 1
    },
    {
      source: "Gueulemer",
      target: "Eponine",
      value: 1
    },
    {
      value: 6,
      target: "Thenardier",
      source: "Babet"
    },
    {
      value: 6,
      target: "Gueulemer",
      source: "Babet"
    },
    {
      source: "Babet",
      target: "Valjean",
      value: 1
    },
    {
      source: "Babet",
      target: "Mme.Thenardier",
      value: 1
    },
    {
      value: 2,
      target: "Javert",
      source: "Babet"
    },
    {
      target: "Gavroche",
      value: 1,
      source: "Babet"
    },
    {
      target: "Eponine",
      value: 1,
      source: "Babet"
    },
    {
      source: "Claquesous",
      value: 4,
      target: "Thenardier"
    },
    {
      value: 4,
      target: "Babet",
      source: "Claquesous"
    },
    {
      target: "Gueulemer",
      value: 4,
      source: "Claquesous"
    },
    {
      source: "Claquesous",
      target: "Valjean",
      value: 1
    },
    {
      source: "Claquesous",
      target: "Mme.Thenardier",
      value: 1
    },
    {
      source: "Claquesous",
      target: "Javert",
      value: 1
    },
    {
      value: 1,
      target: "Eponine",
      source: "Claquesous"
    },
    {
      source: "Claquesous",
      value: 1,
      target: "Enjolras"
    },
    {
      source: "Montparnasse",
      target: "Javert",
      value: 1
    },
    {
      source: "Montparnasse",
      value: 2,
      target: "Babet"
    },
    {
      source: "Montparnasse",
      value: 2,
      target: "Gueulemer"
    },
    {
      target: "Claquesous",
      value: 2,
      source: "Montparnasse"
    },
    {
      source: "Montparnasse",
      value: 1,
      target: "Valjean"
    },
    {
      source: "Montparnasse",
      value: 1,
      target: "Gavroche"
    },
    {
      source: "Montparnasse",
      value: 1,
      target: "Eponine"
    },
    {
      source: "Montparnasse",
      value: 1,
      target: "Thenardier"
    },
    {
      source: "Toussaint",
      target: "Cosette",
      value: 2
    },
    {
      source: "Toussaint",
      value: 1,
      target: "Javert"
    },
    {
      target: "Valjean",
      value: 1,
      source: "Toussaint"
    },
    {
      source: "Child1",
      target: "Gavroche",
      value: 2
    },
    {
      target: "Gavroche",
      value: 2,
      source: "Child2"
    },
    {
      target: "Child1",
      value: 3,
      source: "Child2"
    },
    {
      target: "Babet",
      value: 3,
      source: "Brujon"
    },
    {
      source: "Brujon",
      target: "Gueulemer",
      value: 3
    },
    {
      source: "Brujon",
      target: "Thenardier",
      value: 3
    },
    {
      source: "Brujon",
      target: "Gavroche",
      value: 1
    },
    {
      source: "Brujon",
      value: 1,
      target: "Eponine"
    },
    {
      source: "Brujon",
      target: "Claquesous",
      value: 1
    },
    {
      source: "Brujon",
      value: 1,
      target: "Montparnasse"
    },
    {
      source: "Mme.Hucheloup",
      target: "Bossuet",
      value: 1
    },
    {
      target: "Joly",
      value: 1,
      source: "Mme.Hucheloup"
    },
    {
      source: "Mme.Hucheloup",
      target: "Grantaire",
      value: 1
    },
    {
      source: "Mme.Hucheloup",
      value: 1,
      target: "Bahorel"
    },
    {
      source: "Mme.Hucheloup",
      value: 1,
      target: "Courfeyrac"
    },
    {
      source: "Mme.Hucheloup",
      value: 1,
      target: "Gavroche"
    },
    {
      value: 1,
      target: "Enjolras",
      source: "Mme.Hucheloup"
    }
  ],
  nodes: [
    {
      id: "Myriel",
      group: 1
    },
    {
      id: "Napoleon",
      group: 1
    },
    {
      id: "Mlle.Baptistine",
      group: 1
    },
    {
      group: 1,
      id: "Mme.Magloire"
    },
    {
      id: "CountessdeLo",
      group: 1
    },
    {
      id: "Geborand",
      group: 1
    },
    {
      id: "Champtercier",
      group: 1
    },
    {
      id: "Cravatte",
      group: 1
    },
    {
      id: "Count",
      group: 1
    },
    {
      id: "OldMan",
      group: 1
    },
    {
      id: "Labarre",
      group: 2
    },
    {
      group: 2,
      id: "Valjean"
    },
    {
      id: "Marguerite",
      group: 3
    },
    {
      group: 2,
      id: "Mme.deR"
    },
    {
      group: 2,
      id: "Isabeau"
    },
    {
      id: "Gervais",
      group: 2
    },
    {
      id: "Tholomyes",
      group: 3
    },
    {
      group: 3,
      id: "Listolier"
    },
    {
      id: "Fameuil",
      group: 3
    },
    {
      id: "Blacheville",
      group: 3
    },
    {
      group: 3,
      id: "Favourite"
    },
    {
      group: 3,
      id: "Dahlia"
    },
    {
      group: 3,
      id: "Zephine"
    },
    {
      group: 3,
      id: "Fantine"
    },
    {
      id: "Mme.Thenardier",
      group: 4
    },
    {
      id: "Thenardier",
      group: 4
    },
    {
      id: "Cosette",
      group: 5
    },
    {
      id: "Javert",
      group: 4
    },
    {
      id: "Fauchelevent",
      group: 0
    },
    {
      group: 2,
      id: "Bamatabois"
    },
    {
      id: "Perpetue",
      group: 3
    },
    {
      id: "Simplice",
      group: 2
    },
    {
      id: "Scaufflaire",
      group: 2
    },
    {
      id: "Woman1",
      group: 2
    },
    {
      group: 2,
      id: "Judge"
    },
    {
      group: 2,
      id: "Champmathieu"
    },
    {
      id: "Brevet",
      group: 2
    },
    {
      group: 2,
      id: "Chenildieu"
    },
    {
      group: 2,
      id: "Cochepaille"
    },
    {
      id: "Pontmercy",
      group: 4
    },
    {
      id: "Boulatruelle",
      group: 6
    },
    {
      group: 4,
      id: "Eponine"
    },
    {
      id: "Anzelma",
      group: 4
    },
    {
      id: "Woman2",
      group: 5
    },
    {
      id: "MotherInnocent",
      group: 0
    },
    {
      group: 0,
      id: "Gribier"
    },
    {
      group: 7,
      id: "Jondrette"
    },
    {
      group: 7,
      id: "Mme.Burgon"
    },
    {
      group: 8,
      id: "Gavroche"
    },
    {
      id: "Gillenormand",
      group: 5
    },
    {
      group: 5,
      id: "Magnon"
    },
    {
      group: 5,
      id: "Mlle.Gillenormand"
    },
    {
      id: "Mme.Pontmercy",
      group: 5
    },
    {
      id: "Mlle.Vaubois",
      group: 5
    },
    {
      id: "Lt.Gillenormand",
      group: 5
    },
    {
      group: 8,
      id: "Marius"
    },
    {
      id: "BaronessT",
      group: 5
    },
    {
      group: 8,
      id: "Mabeuf"
    },
    {
      id: "Enjolras",
      group: 8
    },
    {
      id: "Combeferre",
      group: 8
    },
    {
      id: "Prouvaire",
      group: 8
    },
    {
      group: 8,
      id: "Feuilly"
    },
    {
      id: "Courfeyrac",
      group: 8
    },
    {
      id: "Bahorel",
      group: 8
    },
    {
      group: 8,
      id: "Bossuet"
    },
    {
      group: 8,
      id: "Joly"
    },
    {
      group: 8,
      id: "Grantaire"
    },
    {
      group: 9,
      id: "MotherPlutarch"
    },
    {
      id: "Gueulemer",
      group: 4
    },
    {
      id: "Babet",
      group: 4
    },
    {
      id: "Claquesous",
      group: 4
    },
    {
      id: "Montparnasse",
      group: 4
    },
    {
      id: "Toussaint",
      group: 5
    },
    {
      id: "Child1",
      group: 10
    },
    {
      group: 10,
      id: "Child2"
    },
    {
      group: 4,
      id: "Brujon"
    },
    {
      id: "Mme.Hucheloup",
      group: 8
    }
  ]
};

console.log(JSON.stringify(data));

