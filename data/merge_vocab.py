# -*- coding: utf-8 -*-
"""
1. INITIALIZATION
Slouci skolni seznam slovicek (sesit GiveMeFiveSlovicka) s extrakci z ucebnice
(out/vocab.json v1) do out/vocab.json v2 + out/vocab-summary.md.
Skolni seznam = core (jadro), slova navic z ucebnice = bonus.
"""
import json, re, datetime, sys, copy

SRC = '/home/claude/gmf2/out/vocab.json'
OUT_JSON = '/home/claude/gmf2/out/vocab.json'
OUT_MD = '/home/claude/gmf2/out/vocab-summary.md'

# 2. SKOLNI SEZNAM (prepis z fotek sesitu; modre rucni poznamky ignorovany)
# format: (en, cz, pos, emoji)   pos: noun|verb|adj|adv|chunk|num|prep|pron
SCHOOL = {
 's-back-to-school': ('Intro', [
  ('English','angličtina','noun','🇬🇧'),('Listen','poslouchat','verb','👂'),('Write','psát','verb','✍️'),
  ('Sing','zpívat','verb','🎤'),('Speak','mluvit','verb','🗣️'),('His','jeho','pron',None),('Her','její','pron',None),
  ('Music','hudební výchova','noun','🎵'),('Arts and crafts','výtvarná výchova','noun','🎨'),('Maths','matematika','noun','➕'),
  ('ICT','informatika','noun','💻'),('Science','věda, přírodověda','noun','🔬'),('PE','tělocvik','noun','🏃'),
  ('arrive home','přijet domů','verb','🏠'),('inside','vevnitř','adv','📦'),
  ("It's raining.",'Prší.','chunk','🌧️'),("It's stormy.",'Je bouřka.','chunk','⛈️'),("It's cloudy.",'Je zataženo.','chunk','☁️'),
  ("It's sunny.",'Je slunečno.','chunk','☀️'),
  ('wet','mokrý','adj','💧'),('put','položit, dát','verb',None),('dirty','špinavý','adj',None),('clean','čistý','adj','✨'),('better','lepší','adj','👍'),
 ]),
 'u1-move-your-body': ('Unit 1', [
  ('football','fotbal','noun','⚽'),('basketball','košíková, basketbal','noun','🏀'),('baseball','baseball','noun','⚾'),
  ('go skateboarding','jít na skateboard','verb','🛹'),('go cycling','jet na kole','verb','🚴'),('volleyball','volejbal','noun','🏐'),
  ('go swimming','jít plavat','verb','🏊'),('hockey','hokej','noun','🏑'),('go rollerblading','jít na kolečkové brusle','verb','🛼'),
  ('tennis','tenis','noun','🎾'),('mess','nepořádek','noun','🧦'),('every day','každý den','chunk','📅'),
  ('hit','uhodit, trefit','verb','🏏'),('kick','kopnout','verb','🦵'),('watch out','dávej pozor','chunk','⚠️'),
  ("I can't",'nemohu','chunk','🙅'),('rollerblades','kolečkové brusle','noun','🛼'),('football boots','kopačky','noun','👟'),
  ('tennis racket','tenisová raketa','noun','🎾'),('organise','zorganizovat','verb','📋'),('baseball bat','baseballová pálka','noun','🏏'),
  ('You can','ty můžeš','chunk','👍'),('race','závod','noun','🏁'),('fast','rychle, rychlý','adj','💨'),('walk','jít','verb','🚶'),
  ('contain','obsahovat','verb',None),('hold','držet','verb','✊'),('primary school','základní škola','noun','🏫'),
  ('join in','zapojit se','verb','🙋'),('get in','vlézt dovnitř','verb','🚪'),
 ]),
 'u2-lets-go-shopping': ('Unit 2', [
  ('bread','chleba','noun','🍞'),('pineapple','ananas','noun','🍍'),('potatoes','brambory','noun','🥔'),('tomatoes','rajčata','noun','🍅'),
  ('green beans','zelené fazolky','noun','🫛'),('yoghurt','jogurt','noun','🥛'),('sweets','sladkosti','noun','🍬'),
  ('Can I have?','Mohu dostat?','chunk','🙏'),
  ('twenty','dvacet','num',None),('thirty','třicet','num',None),('forty','čtyřicet','num',None),('fifty','padesát','num',None),
  ("I'll take it.",'Vezmu si to.','chunk','🛒'),('Queen','královna','noun','👑'),('How much are these?','Kolik stojí tyto?','chunk','💰'),
  ('pancake','palačinka','noun','🥞'),('flour','mouka','noun','🌾'),('bowl','mísa','noun','🥣'),('mix','zamíchat','verb','🥄'),
  ('put','dát, položit','verb',None),('sugar','cukr','noun','🧂'),('at the same time','ve stejnou chvíli','chunk','⏱️'),
  ('slice','krajíc','noun','🍞'),('piece','kus','noun','🍰'),('add','přidat','verb','➕'),('finally','nakonec','adv','🏁'),
  ('peach','broskev','noun','🍑'),('carrots','mrkve','noun','🥕'),
 ]),
 'u3-at-the-zoo': ('Unit 3', [
  ('wild','divoké','adj','🌿'),('dangerous','nebezpečný','adj','⚠️'),('hair','chlupy, srst','noun',None),
  ('crocodile','krokodýl','noun','🐊'),('lion','lev','noun','🦁'),('snake','had','noun','🐍'),('monkey','opice','noun','🐒'),
  ('penguin','tučňák','noun','🐧'),('elephant','slon','noun','🐘'),('lizard','ještěr','noun','🦎'),('giraffe','žirafa','noun','🦒'),
  ('hippo','hroch','noun','🦛'),('tiger','tygr','noun','🐯'),('guess','uhodnout','verb','🤔'),
  ('Has it got?','Má to?','chunk','❓'),('Have they got?','Mají (oni)?','chunk','❓'),("Hasn't got",'nemá','chunk','🚫'),("Haven't got",'nemají','chunk','🚫'),
  ('inside','uvnitř','adv','📦'),('mysterious','záhadný','adj','🕵️'),('appear','objevit se','verb','✨'),('find','najít','verb','🔍'),
  ('feathers','peří','noun','🪶'),('lost','ztracený','adj','❓'),('body','tělo','noun','🧍'),('wings','křídla','noun','🪽'),
  ('beak','zobák','noun','🐦'),('teeth','zuby','noun','🦷'),('face','tvář','noun','🙂'),('tail','ocas','noun','🐒'),
  ('seeds','semínka','noun','🌱'),('nuts','oříšky','noun','🥜'),('hedgehog','ježek','noun','🦔'),('dish','miska','noun','🥣'),
  ('fox','liška','noun','🦊'),('squirrel','veverka','noun','🐿️'),('rainforest','deštný prales','noun','🌴'),('leaves','listy','noun','🍃'),
 ]),
 'u4-the-nature-trail': ('Unit 4', [
  ('trail','stezka','noun','🥾'),('walk','jít pěšky','verb','🚶'),('deep','hluboký','adj','🌊'),('forest','les','noun','🌲'),
  ('hill','kopec','noun','⛰️'),('river','řeka','noun','🏞️'),('lake','jezero','noun','🏞️'),('sand','písek','noun','🏖️'),
  ('road','cesta','noun','🛣️'),('path','cestička','noun','🛤️'),('bridge','most','noun','🌉'),('along','po','prep','➡️'),
  ('cycle path','cyklostezka','noun','🚴'),('roll','valit se','verb','🔄'),('why','proč','adv','❓'),('crazy','bláznivý','adj','🤪'),
  ('chase','honit','verb','🏃'),('spines','ostny','noun','🦔'),('better','lepší','adj','👍'),('up','nahoru','adv','⬆️'),
  ('down','dolů','adv','⬇️'),('across','přes','prep','↔️'),('trip','výlet','noun','🎒'),('den','doupě','noun','🕳️'),
  ('branch','větev','noun','🌳'),('twig','větvička','noun','🌿'),('explore','prozkoumávat','verb','🧭'),('touch','dotknout se','verb','👆'),
  ('smell','čichat','verb','👃'),('mud','bláto','noun','🟤'),('hero','hrdina','noun','🦸'),('secret passage','tajná cesta','noun','🚪'),
  ('dark cave','tmavá jeskyně','noun','🕳️'),('beach','pláž','noun','🏖️'),('treasure','poklad','noun','💰'),('escape','utéci','verb','🏃'),
  ('giant','gigantický, obrovský','adj','🦣'),('torch','baterka','noun','🔦'),
 ]),
 'u5-the-frozen-lake': ('Unit 5', [
  ('skate','bruslit','verb','⛸️'),('drink','pít','verb','🥤'),('wave','mávat','verb','👋'),('smile','usmívat se','verb','😊'),
  ('dance','tančit','verb','💃'),('make a snowman','stavět sněhuláka','verb','⛄'),('take a photo','fotit','verb','📸'),
  ('listen to music','poslouchat hudbu','verb','🎧'),('quickly','rychle','adv','💨'),('fat tummy','tlusté břicho','noun','🫃'),
  ('sledge','saně','noun','🛷'),('move','hýbat se','verb','🕺'),('fat','tlustý','adj',None),('thin','tenký','adj',None),
  ('short','krátký, malý','adj','📏'),('tall','vysoký','adj','🦒'),('clean','čistý','adj','✨'),('dirty','špinavý','adj',None),
  ('scarf','šála','noun','🧣'),('ice rink','kluziště','noun','⛸️'),('dry','suchý','adj','☀️'),('ski slope','sjezdovka','noun','⛷️'),
  ('spring','jaro','noun','🌸'),('summer','léto','noun','☀️'),('autumn','podzim','noun','🍂'),('winter','zima','noun','❄️'),
  ('grasshopper','kobylka','noun','🦗'),('ant','mravenec','noun','🐜'),('collect','sbírat','verb','🧺'),('answer','odpovědět','verb','💬'),
  ('silly','hloupý','adj','🤪'),
 ]),
 'u6-all-year-round': ('Unit 6', [
  ('smell flowers','čichat ke květinám','verb','🌷'),('plant seeds','sázet (semínka)','verb','🌱'),('finish school','skončit školu','verb','🎒'),
  ('eat chestnuts','jíst kaštany','verb','🌰'),('celebrate Halloween','slavit Halloween','verb','🎃'),('wear warm clothes','nosit teplé oblečení','verb','🧥'),
  ('open presents','rozbalit dárky','verb','🎁'),('season','roční období','noun','🍂'),('outside','venku','adv','🌳'),('postcard','pohlednice','noun','📮'),
  ('What do you do?','Co děláš?','chunk','❓'),('impossible','nemožné','adj','🚫'),('camera','fotoaparát','noun','📷'),
  ("What's happening?",'Co se děje?','chunk','❓'),('joke','vtip','noun','😂'),('festival','svátek','noun','🎉'),('remember','pamatovat si, nezapomeň','verb','🧠'),
  ('turkey','krocan','noun','🦃'),
  ('January','leden','noun','📅'),('February','únor','noun','📅'),('March','březen','noun','📅'),('April','duben','noun','📅'),
  ('May','květen','noun','📅'),('June','červen','noun','📅'),('July','červenec','noun','📅'),('August','srpen','noun','📅'),
  ('September','září','noun','📅'),('October','říjen','noun','📅'),('November','listopad','noun','📅'),('December','prosinec','noun','📅'),
  ('except for','kromě','prep',None),('leap year','přestupný rok','noun','📆'),
  ('first','první (1st)','num','1️⃣'),('second','druhý (2nd)','num','2️⃣'),('third','třetí (3rd)','num','3️⃣'),('fourth','čtvrtý (4th)','num','4️⃣'),
  ('fifth','pátý (5th)','num','5️⃣'),('sixth','šestý (6th)','num','6️⃣'),('seventh','sedmý (7th)','num','7️⃣'),('eighth','osmý (8th)','num','8️⃣'),
  ('ninth','devátý (9th)','num','9️⃣'),('tenth','desátý (10th)','num','🔟'),('eleventh','jedenáctý (11th)','num',None),('twelfth','dvanáctý (12th)','num',None),
  ('thirteenth','třináctý (13th)','num',None),('fourteenth','čtrnáctý (14th)','num',None),('fifteenth','patnáctý (15th)','num',None),
  ('sixteenth','šestnáctý (16th)','num',None),('seventeenth','sedmnáctý (17th)','num',None),('eighteenth','osmnáctý (18th)','num',None),
  ('nineteenth','devatenáctý (19th)','num',None),('twentieth','dvacátý (20th)','num',None),('twenty-first','dvacátý první (21st)','num',None),
  ('twenty-second','dvacátý druhý (22nd)','num',None),('twenty-third','dvacátý třetí (23rd)','num',None),('thirtieth','třicátý (30th)','num',None),
 ]),
 'u7-my-house': ('Unit 7', [
  ('flat','byt','noun','🏢'),('house','dům','noun','🏠'),('living room','obývací pokoj','noun','🛋️'),('kitchen','kuchyně','noun','🍳'),
  ('bathroom','koupelna','noun','🛁'),('bedroom','ložnice','noun','🛏️'),('dining room','jídelna','noun','🍽️'),('hall','předsíň','noun','🚪'),
  ('garden','zahrada','noun','🌻'),('garage','garáž','noun','🚗'),('water','zalévat','verb','🚿'),('shut','zavřít','verb','🚪'),
  ('haunted house','strašidelný dům','noun','🏚️'),('funfair','pouť','noun','🎡'),('ghosts','duchové','noun','👻'),('witches','čarodějnice','noun','🧙'),
  ('skeletons','kostry','noun','💀'),('scared','vystrašený','adj','😨'),('armchair','křeslo','noun','🪑'),('clock','hodiny','noun','🕰️'),
  ('radio','rádio','noun','📻'),('box','krabice','noun','📦'),('phone','telefon','noun','📱'),('watch','hodinky','noun','⌚'),
  ('Whose?','Čí?','chunk','❓'),('hers','její','pron',None),('yours','tvoje','pron',None),('mine','moje','pron',None),
  ('upstairs','nahoře v patře','adv','⬆️'),('sticker','nálepka','noun','🏷️'),('board game','desková hra','noun','🎲'),
  ('pumpkin','dýně','noun','🎃'),('dragon','drak','noun','🐉'),('mice','myši','noun','🐭'),('fairy godmother','kouzelná víla','noun','🧚'),
  ('wicked','zlý','adj','😈'),('sad','smutný','adj','😢'),('glass','sklo','noun','🪟'),('midnight','půlnoc','noun','🕛'),('fall off','spadnout','verb','🤸'),
 ]),
 'u8-all-around-the-town': ('Unit 8', [
  ("baker's",'pekárna','noun','🥖'),('fire station','hasičská stanice','noun','🚒'),('police station','policejní stanice','noun','🚓'),
  ('car park','parkoviště','noun','🅿️'),('bank','banka','noun','🏦'),('post office','pošta','noun','📮'),("chemist's",'drogerie, lékárna','noun','💊'),
  ('bus station','autobusové nádraží','noun','🚌'),('train station','vlakové nádraží','noun','🚉'),('museum','muzeum','noun','🏛️'),
  ("it's dark",'je tma','chunk','🌑'),('turn','zaboč','verb','↪️'),('left','doleva','adv','⬅️'),('right','doprava','adv','➡️'),
  ('go straight on','jdi rovně','chunk','⬆️'),('How do I get to…?','Jak se dostanu k…?','chunk','❓'),('people','lidé','noun','👥'),
  ('firefighter','hasič','noun','🧑‍🚒'),('drive','řídit','verb','🚗'),('loud','hlasitý','adj','🔊'),('a date','datum','noun','📅'),
 ]),
 'u9-holiday-fun': ('Unit 9', [
  ('lots of','hodně','chunk','🔢'),('castle','hrad','noun','🏰'),('circus','cirkus','noun','🎪'),('science museum','vědecké muzeum','noun','🔬'),
  ('funfair','pouť','noun','🎡'),('chocolate factory','továrna na čokoládu','noun','🍫'),('aquarium','akvárium','noun','🐠'),
  ('sports centre','sportovní centrum','noun','🏟️'),('safari park','safari park','noun','🦓'),('theatre','divadlo','noun','🎭'),
  ('Where were you?','Kde jsi byl?','chunk','❓'),('I was','já jsem byl','chunk','🕰️'),('yesterday','včera','adv','⏪'),('bored','znuděný','adj','🥱'),
  ('water park','vodní park','noun','🏊'),('fly','letět','verb','✈️'),('man','muž','noun','👨'),('men','muži','noun','👨‍👨‍👦'),
  ('woman','žena','noun','👩'),('women','ženy','noun','👩‍👩‍👧'),('child','dítě','noun','🧒'),('children','děti','noun','👧👦'),
  ('maze','bludiště','noun','🌀'),('chess','šachy','noun','♟️'),('butterfly','motýl','noun','🦋'),('ticket','lístek','noun','🎟️'),('badge','odznak','noun','🏅'),
 ]),
}

# 3. FRAZE NAVIC (rozhovory a vazby z ucebnice, doplneno k extrakci) - core
EXTRA_PHRASES = {
 's-back-to-school': [
  ("Listen and repeat.","Poslouchej a opakuj.","Listen and ___."),
  ("Write your name.","Napiš své jméno.","Write ___."),
  ("Sing the song.","Zazpívej písničku.",None),
  ("What's the weather like? It's sunny.","Jaké je počasí? Je slunečno.","It's ___."),
  ("Put on your coat. It's raining.","Obleč si kabát. Prší.",None),
  ("My shoes are wet and dirty.","Moje boty jsou mokré a špinavé.",None),
 ],
 'u1-move-your-body': [
  ("I play football every day.","Hraju fotbal každý den.","I play ___ every day."),
  ("I go swimming on Saturday.","V sobotu chodím plavat.","I go ___ on ___."),
  ("Watch out! Kick the ball!","Pozor! Kopni do míče!",None),
  ("You can hit the ball with a baseball bat.","Můžeš odpálit míč baseballovou pálkou.","You can ___."),
  ("I can't play tennis without a racket.","Nemůžu hrát tenis bez rakety.","I can't ___."),
  ("What a mess! Let's organise the sports room.","To je nepořádek! Pojďme uklidit tělocvičnu.",None),
  ("Join in! Get in the team!","Přidej se! Vlez do týmu!",None),
  ("It's a race. Run fast!","Je to závod. Běž rychle!",None),
 ],
 'u2-lets-go-shopping': [
  ("Can I have some bread, please? Here you are.","Můžu dostat chleba, prosím? Tady máš.","Can I have some ___, please?"),
  ("How much is it? It's fifty cents.","Kolik to stojí? Padesát centů.","How much is it? It's ___ cents."),
  ("I'd like a piece of cake, please.","Chtěl bych kousek dortu, prosím.","a piece of ___"),
  ("We need flour, sugar and eggs.","Potřebujeme mouku, cukr a vejce.",None),
  ("Finally, we eat the cake!","Nakonec sníme dort!",None),
 ],
 'u3-at-the-zoo': [
  ("Guess the animal! Has it got a long tail?","Uhodni zvíře! Má dlouhý ocas?","Has it got ___?"),
  ("It's got big teeth and it's dangerous.","Má velké zuby a je nebezpečné.","It's got ___."),
  ("Have they got feathers? Yes, they have.","Mají peří? Ano, mají.","Have they got ___?"),
  ("It hasn't got wings. It's a hippo!","Nemá křídla. Je to hroch!","It hasn't got ___."),
  ("A mysterious animal appears in the rainforest.","V deštném pralese se objeví záhadné zvíře.",None),
  ("The hedgehog is lost. Find it!","Ježek se ztratil. Najdi ho!",None),
  ("Wild animals live in the rainforest.","Divoká zvířata žijí v deštném pralese.",None),
 ],
 'u4-the-nature-trail': [
  ("Walk along the path to the bridge.","Jdi po cestičce k mostu.","Walk along the ___."),
  ("He's running up the hill and down to the river.","Běží nahoru do kopce a dolů k řece.","up the ___ / down to the ___"),
  ("Why is the dog crazy? It's chasing a hedgehog!","Proč je ten pes bláznivý? Honí ježka!",None),
  ("Don't touch the spines!","Nesahej na ostny!","Don't touch ___."),
  ("Let's explore the dark cave with a torch.","Pojďme prozkoumat tmavou jeskyni s baterkou.",None),
  ("There's treasure in the secret passage!","V tajné chodbě je poklad!",None),
  ("The lake is deep. Watch out!","Jezero je hluboké. Pozor!",None),
  ("We go across the bridge on our trip.","Na výletě jdeme přes most.",None),
 ],
 'u5-the-frozen-lake': [
  ("We're skating on the ice rink.","Bruslíme na kluzišti.","We're ___ing."),
  ("Are you making a snowman? Yes, we are.","Stavíte sněhuláka? Ano, stavíme.","Are you ___ing?"),
  ("Smile and wave! I'm taking a photo.","Usměj se a zamávej! Fotím.",None),
  ("He's tall and thin. She's short and fat.","On je vysoký a hubený. Ona je malá a tlustá.",None),
  ("Move quickly! The sledge is fast!","Hýbej se rychle! Saně jsou rychlé!",None),
  ("My scarf is wet and dirty.","Moje šála je mokrá a špinavá.",None),
  ("Collect the leaves and answer the question.","Posbírej listy a odpověz na otázku.",None),
  ("Don't be silly!","Nebuď hloupý!",None),
 ],
 'u6-all-year-round': [
  ("What do you do in autumn? We eat chestnuts.","Co děláte na podzim? Jíme kaštany.","What do you do in ___?"),
  ("In winter we wear warm clothes.","V zimě nosíme teplé oblečení.","In ___ we ___."),
  ("What's happening? It's a festival!","Co se děje? Je svátek!",None),
  ("When's your birthday? It's on the third of May.","Kdy máš narozeniny? Třetího května.","It's on the ___ of ___."),
  ("Remember! February has got 29 days in a leap year.","Pamatuj! Únor má v přestupném roce 29 dní.",None),
  ("I play outside every day except for Sunday.","Hraju si venku každý den kromě neděle.","every day except for ___"),
  ("That's impossible! It's a joke.","To není možné! Je to vtip.",None),
  ("Send me a postcard from the sea!","Pošli mi pohlednici od moře!",None),
 ],
 'u7-my-house': [
  ("There's a clock in the kitchen.","V kuchyni jsou hodiny.","There's a ___ in the ___."),
  ("There aren't any ghosts in the bathroom.","V koupelně nejsou žádní duchové.","There aren't any ___."),
  ("Whose is this watch? It's mine.","Čí jsou tyhle hodinky? Moje.","Whose is this ___?"),
  ("Is it yours? No, it's hers.","Je to tvoje? Ne, je to její.",None),
  ("Shut the door! I'm scared!","Zavři dveře! Bojím se!",None),
  ("The bedroom is upstairs.","Ložnice je nahoře v patře.",None),
  ("Water the garden, please.","Zalij zahradu, prosím.",None),
  ("At midnight the pumpkin falls off the table.","O půlnoci dýně spadne ze stolu.",None),
 ],
 'u8-all-around-the-town': [
  ("How do I get to the bank? Go straight on.","Jak se dostanu k bance? Jdi rovně.","How do I get to the ___?"),
  ("Turn left at the post office.","U pošty zaboč doleva.","Turn left/right at the ___."),
  ("Is there a baker's near here? Yes, there is.","Je tady blízko pekárna? Ano, je.","Is there a ___ near here?"),
  ("Where's the museum? It's next to the car park.","Kde je muzeum? Vedle parkoviště.","Where's the ___?"),
  ("The firefighter drives to the fire station.","Hasič jede k hasičské stanici.",None),
  ("It's dark and the music is loud.","Je tma a hudba je hlasitá.",None),
  ("Lots of people are at the train station.","Na vlakovém nádraží je hodně lidí.",None),
  ("What's the date today?","Kolikátého je dnes?",None),
 ],
 'u9-holiday-fun': [
  ("Where were you yesterday? I was at the circus.","Kde jsi byl včera? Byl jsem v cirkuse.","I was at the ___."),
  ("We were at the chocolate factory.","Byli jsme v továrně na čokoládu.","We were at the ___."),
  ("Was it fun? No, I was bored.","Byla to zábava? Ne, nudil jsem se.",None),
  ("Who's that man? He's my uncle.","Kdo je ten muž? Můj strýc.","Who's that ___?"),
  ("The children are in the maze.","Děti jsou v bludišti.",None),
  ("Lots of butterflies fly in the garden.","Na zahradě létá hodně motýlů.",None),
  ("Two tickets for the theatre, please.","Dva lístky do divadla, prosím.",None),
  ("I've got a badge from the safari park.","Mám odznak ze safari parku.",None),
 ],
}

# 4. RUCNI PRIKLADY K VYBRANYM SLOVUM (kde sablona nevyhovuje)
MANUAL_EXAMPLES = {
 # Unit 8 / 9 mista a dalsi s ceskymi pady
 "baker's": ("Is there a baker's near here?","Je tady blízko pekárna?"),
 'fire station': ("Turn right at the fire station.","U hasičské stanice zaboč doprava."),
 'police station': ("Where's the police station?","Kde je policejní stanice?"),
 'car park': ("The car park is next to the bank.","Parkoviště je vedle banky."),
 'bank': ("How do I get to the bank?","Jak se dostanu k bance?"),
 'post office': ("Go straight on to the post office.","Jdi rovně k poště."),
 "chemist's": ("The chemist's is on the left.","Drogerie je nalevo."),
 'bus station': ("Is there a bus station in the town?","Je ve městě autobusové nádraží?"),
 'train station': ("Turn left at the train station.","U vlakového nádraží zaboč doleva."),
 'museum': ("Where's the museum?","Kde je muzeum?"),
 'castle': ("I was at the castle yesterday.","Včera jsem byl na hradě."),
 'circus': ("We were at the circus.","Byli jsme v cirkuse."),
 'science museum': ("I was at the science museum.","Byl jsem ve vědeckém muzeu."),
 'funfair': ("Were you at the funfair?","Byl jsi na pouti?"),
 'chocolate factory': ("We were at the chocolate factory.","Byli jsme v továrně na čokoládu."),
 'aquarium': ("I was at the aquarium yesterday.","Včera jsem byl v akváriu."),
 'sports centre': ("Where were you? At the sports centre.","Kde jsi byl? Ve sportovním centru."),
 'safari park': ("I was at the safari park.","Byl jsem v safari parku."),
 'theatre': ("We were at the theatre.","Byli jsme v divadle."),
 'water park': ("Were you at the water park?","Byl jsi ve vodním parku?"),
 'maze': ("The children are in the maze.","Děti jsou v bludišti."),
 'chess': ("Let's play chess!","Pojďme hrát šachy!"),
 'butterfly': ("Look! A butterfly!","Podívej! Motýl!"),
 'ticket': ("Two tickets, please.","Dva lístky, prosím."),
 'badge': ("I've got a new badge.","Mám nový odznak."),
 'man': ("Who's that man?","Kdo je ten muž?"), 'men': ("Those men are firefighters.","Ti muži jsou hasiči."),
 'woman': ("That woman is my aunt.","Ta žena je moje teta."), 'women': ("The women are at the theatre.","Ty ženy jsou v divadle."),
 'child': ("The child is bored.","To dítě se nudí."), 'children': ("Who are those children?","Kdo jsou ty děti?"),
 'yesterday': ("Where were you yesterday?","Kde jsi byl včera?"), 'bored': ("I was bored.","Nudil jsem se."),
 'fly': ("Butterflies fly in the garden.","Motýli létají na zahradě."), 'lots of': ("Lots of people are here.","Je tady hodně lidí."),
 'Where were you?': ("Where were you yesterday?","Kde jsi byl včera?"), 'I was': ("I was at the circus.","Byl jsem v cirkuse."),
 # Unit 5 cinnosti (ing-tvary)
 'skate': ("We're skating.","Bruslíme."), 'drink': ("He's drinking hot chocolate.","Pije horkou čokoládu."),
 'wave': ("She's waving.","Mává."), 'smile': ("Smile! I'm taking a photo.","Usměj se! Fotím."),
 'dance': ("Are you dancing? Yes, we are.","Tančíte? Ano, tančíme."), 'make a snowman': ("We're making a snowman.","Stavíme sněhuláka."),
 'take a photo': ("I'm taking a photo.","Fotím."), 'listen to music': ("They're listening to music.","Poslouchají hudbu."),
 'move': ("Move quickly!","Hýbej se rychle!"), 'sledge': ("The sledge is fast.","Saně jsou rychlé."),
 'quickly': ("Run quickly!","Běž rychle!"), 'fat tummy': ("The snowman has got a fat tummy.","Sněhulák má tlusté břicho."),
 'scarf': ("My scarf is red.","Moje šála je červená."), 'ice rink': ("We're skating on the ice rink.","Bruslíme na kluzišti."),
 'ski slope': ("The ski slope is long.","Sjezdovka je dlouhá."), 'collect': ("Collect the leaves!","Posbírej listy!"),
 'answer': ("Answer the question.","Odpověz na otázku."), 'silly': ("Don't be silly!","Nebuď hloupý!"),
 'grasshopper': ("The grasshopper is green.","Kobylka je zelená."), 'ant': ("The ant is small.","Mravenec je malý."),
 # Unit 4 priroda
 'trail': ("Follow the nature trail.","Jdi po naučné stezce."), 'walk': ("Walk along the path.","Jdi po cestičce."),
 'deep': ("The lake is deep.","Jezero je hluboké."), 'forest': ("We walk through the forest.","Jdeme lesem."),
 'hill': ("He's running up the hill.","Běží nahoru do kopce."), 'river': ("She's swimming in the river.","Plave v řece."),
 'lake': ("The lake is cold.","Jezero je studené."), 'sand': ("The sand is hot.","Písek je horký."),
 'road': ("Don't run across the road!","Neběhej přes silnici!"), 'path': ("Walk along the path.","Jdi po cestičce."),
 'bridge': ("Go across the bridge.","Jdi přes most."), 'along': ("Walk along the river.","Jdi podél řeky."),
 'cycle path': ("Ride your bike on the cycle path.","Jezdi na kole po cyklostezce."), 'roll': ("The ball is rolling down the hill.","Míč se valí z kopce."),
 'why': ("Why are you running?","Proč běžíš?"), 'crazy': ("The dog is crazy!","Ten pes je bláznivý!"),
 'chase': ("The dog is chasing the cat.","Pes honí kočku."), 'spines': ("A hedgehog has got spines.","Ježek má ostny."),
 'better': ("This path is better.","Tahle cesta je lepší."), 'up': ("Go up the hill.","Jdi nahoru do kopce."),
 'down': ("Run down the hill.","Běž dolů z kopce."), 'across': ("Walk across the bridge.","Jdi přes most."),
 'trip': ("We're on a school trip.","Jsme na školním výletě."), 'den': ("The fox is in its den.","Liška je ve svém doupěti."),
 'branch': ("The bird is on a branch.","Pták je na větvi."), 'twig': ("Collect some twigs.","Nasbírej větvičky."),
 'explore': ("Let's explore the forest!","Pojďme prozkoumat les!"), 'touch': ("Don't touch it!","Nesahej na to!"),
 'smell': ("Smell the flowers.","Přivoň si ke květinám."), 'mud': ("My boots are in the mud.","Moje boty jsou v blátě."),
 'hero': ("You're a hero!","Jsi hrdina!"), 'secret passage': ("There's a secret passage in the castle.","V hradě je tajná chodba."),
 'dark cave': ("It's a dark cave.","Je to tmavá jeskyně."), 'beach': ("We go to the beach in summer.","V létě chodíme na pláž."),
 'treasure': ("Find the treasure!","Najdi poklad!"), 'escape': ("The mouse escapes from the cat.","Myš uteče kočce."),
 'giant': ("It's a giant tree!","To je obrovský strom!"), 'torch': ("I've got a torch.","Mám baterku."),
 # Unit 7
 'water': ("Water the plants, please.","Zalij kytky, prosím."), 'shut': ("Shut the window!","Zavři okno!"),
 'haunted house': ("There's a haunted house at the funfair.","Na pouti je strašidelný dům."), 'funfair': ("Let's go to the funfair!","Pojďme na pouť!"),
 'ghosts': ("There are ghosts in the hall!","V předsíni jsou duchové!"), 'witches': ("Two witches are in the kitchen.","V kuchyni jsou dvě čarodějnice."),
 'skeletons': ("There aren't any skeletons.","Nejsou tam žádné kostry."), 'scared': ("I'm scared!","Bojím se!"),
 'Whose?': ("Whose is this phone?","Čí je tenhle telefon?"), 'hers': ("It's hers.","Je to její."), 'yours': ("Is it yours?","Je to tvoje?"),
 'mine': ("It's mine.","Je to moje."), 'upstairs': ("The bathroom is upstairs.","Koupelna je nahoře v patře."),
 'sticker': ("I've got a new sticker.","Mám novou nálepku."), 'board game': ("Let's play a board game!","Pojďme hrát deskovou hru!"),
 'pumpkin': ("The pumpkin is on the table.","Dýně je na stole."), 'dragon': ("There's a dragon in the story.","V příběhu je drak."),
 'mice': ("There are mice in the garage!","V garáži jsou myši!"), 'fairy godmother': ("The fairy godmother helps Cinderella.","Kouzelná víla pomáhá Popelce."),
 'wicked': ("The wicked witch is scared.","Zlá čarodějnice se bojí."), 'sad': ("Why are you sad?","Proč jsi smutný?"),
 'glass': ("The shoe is made of glass.","Střevíček je ze skla."), 'midnight': ("At midnight the magic ends.","O půlnoci kouzlo končí."),
 'fall off': ("Don't fall off the chair!","Nespadni ze židle!"),
 # Unit 8 ostatni
 "it's dark": ("It's dark in the cave.","V jeskyni je tma."), 'turn': ("Turn left.","Zaboč doleva."), 'left': ("Turn left at the bank.","U banky zaboč doleva."),
 'right': ("Turn right.","Zaboč doprava."), 'go straight on': ("Go straight on to the museum.","Jdi rovně k muzeu."),
 'How do I get to…?': ("How do I get to the post office?","Jak se dostanu na poštu?"), 'people': ("Lots of people are in the park.","V parku je hodně lidí."),
 'firefighter': ("A firefighter puts out fires.","Hasič hasí požáry."), 'drive': ("My dad drives a car.","Táta řídí auto."),
 'loud': ("The music is loud.","Hudba je hlasitá."), 'a date': ("What's the date today?","Kolikátého je dnes?"),
 # Unit 6
 'season': ("What's your favourite season?","Jaké je tvé oblíbené roční období?"), 'outside': ("We play outside.","Hrajeme si venku."),
 'postcard': ("Send me a postcard!","Pošli mi pohlednici!"), 'What do you do?': ("What do you do in winter?","Co děláš v zimě?"),
 'impossible': ("That's impossible!","To není možné!"), 'camera': ("I've got a new camera.","Mám nový fotoaparát."),
 "What's happening?": ("What's happening? It's a festival!","Co se děje? Je svátek!"), 'joke': ("It's a joke!","Je to vtip!"),
 'festival': ("Harvest Festival is in autumn.","Dožínky jsou na podzim."), 'remember': ("Remember your camera!","Nezapomeň si fotoaparát!"),
 'turkey': ("We eat turkey in December.","V prosinci jíme krocana."), 'except for': ("Every day except for Sunday.","Každý den kromě neděle."),
 'leap year': ("A leap year has got 366 days.","Přestupný rok má 366 dní."),
 # Unit 3
 'wild': ("Lions are wild animals.","Lvi jsou divoká zvířata."), 'dangerous': ("Crocodiles are dangerous.","Krokodýli jsou nebezpeční."),
 'hair': ("It's got brown hair.","Má hnědou srst."), 'guess': ("Guess the animal!","Uhodni zvíře!"),
 'Has it got?': ("Has it got a tail? Yes, it has.","Má ocas? Ano, má."), 'Have they got?': ("Have they got wings? No, they haven't.","Mají křídla? Ne, nemají."),
 "Hasn't got": ("It hasn't got a beak.","Nemá zobák."), "Haven't got": ("They haven't got legs.","Nemají nohy."),
 'inside': ("The snake is inside the box.","Had je uvnitř krabice."), 'mysterious': ("It's a mysterious animal.","Je to záhadné zvíře."),
 'appear': ("A fox appears in the garden.","Na zahradě se objeví liška."), 'find': ("Find the hedgehog!","Najdi ježka!"),
 'feathers': ("Birds have got feathers.","Ptáci mají peří."), 'lost': ("The squirrel is lost.","Veverka se ztratila."),
 'body': ("It's got a long body.","Má dlouhé tělo."), 'wings': ("Penguins have got wings.","Tučňáci mají křídla."),
 'beak': ("It's got a big beak.","Má velký zobák."), 'teeth': ("Crocodiles have got big teeth.","Krokodýli mají velké zuby."),
 'face': ("Paint your face!","Namaluj si obličej!"), 'tail': ("Monkeys have got long tails.","Opice mají dlouhé ocasy."),
 'seeds': ("Birds eat seeds.","Ptáci jedí semínka."), 'nuts': ("Squirrels eat nuts.","Veverky jedí oříšky."),
 'dish': ("Put water in the dish.","Nalij vodu do misky."), 'rainforest': ("Monkeys live in the rainforest.","Opice žijí v deštném pralese."),
 'leaves': ("Giraffes eat leaves.","Žirafy jedí listy."),
 # Unit 1
 'mess': ("What a mess!","To je nepořádek!"), 'every day': ("I play football every day.","Hraju fotbal každý den."),
 'hit': ("Hit the ball!","Odpal míč!"), 'kick': ("Kick the ball!","Kopni do míče!"), 'watch out': ("Watch out!","Pozor!"),
 "I can't": ("I can't swim.","Neumím plavat."), 'rollerblades': ("I've got new rollerblades.","Mám nové kolečkové brusle."),
 'football boots': ("My football boots are dirty.","Moje kopačky jsou špinavé."), 'tennis racket': ("I've got a tennis racket.","Mám tenisovou raketu."),
 'organise': ("Let's organise a race!","Uspořádejme závod!"), 'baseball bat': ("Hit the ball with the baseball bat.","Odpal míč baseballovou pálkou."),
 'You can': ("You can do it!","Zvládneš to!"), 'race': ("Let's have a race!","Dáme si závod!"), 'fast': ("Run fast!","Běž rychle!"),
 'contain': ("The box contains a ball.","Krabice obsahuje míč."), 'hold': ("Hold the bat!","Drž pálku!"),
 'primary school': ("I go to primary school.","Chodím na základní školu."), 'join in': ("Join in!","Přidej se!"), 'get in': ("Get in the car!","Nastup do auta!"),
 # Intro
 'English': ("My favourite subject is English.","Můj oblíbený předmět je angličtina."), 'Listen': ("Listen to the song.","Poslouchej písničku."),
 'Write': ("Write your name.","Napiš své jméno."), 'Sing': ("Sing a song!","Zazpívej písničku!"), 'Speak': ("Speak English, please.","Mluv anglicky, prosím."),
 'His': ("His name is Jake.","Jmenuje se Jake. (jeho jméno)"), 'Her': ("Her name is Molly.","Jmenuje se Molly. (její jméno)"),
 'arrive home': ("I arrive home at four.","Přijedu domů ve čtyři."), "It's raining.": ("It's raining today.","Dnes prší."),
 "It's stormy.": ("It's stormy. Stay inside!","Je bouřka. Zůstaň uvnitř!"), "It's cloudy.": ("It's cloudy today.","Dnes je zataženo."),
 "It's sunny.": ("It's sunny. Let's go outside!","Je slunečno. Pojďme ven!"), 'wet': ("My hair is wet.","Mám mokré vlasy."),
 'put': ("Put the book on the table.","Polož knihu na stůl."), 'dirty': ("My hands are dirty.","Mám špinavé ruce."),
 'clean': ("My hands are clean.","Mám čisté ruce."), 'turn left': ("Turn left at the bank.","U banky zaboč doleva."),
 # Unit 2
 'Can I have?': ("Can I have an apple, please?","Můžu dostat jablko, prosím?"), 'finally': ("Finally, we eat!","Nakonec jíme!"),
 'piece': ("A piece of cake, please.","Kousek dortu, prosím."), 'flour': ("We need some flour.","Potřebujeme mouku."), 'sugar': ("Can I have some sugar?","Můžu dostat cukr?"),
}

MANUAL_EXAMPLES.update({
 'dog': ("I've got a dog.","Mám psa."), 'hamster': ("I've got a hamster.","Mám křečka."), 'parrot': ("My parrot can talk.","Můj papoušek umí mluvit."),
 'rabbit': ("I've got a rabbit.","Mám králíka."), 'spider': ("There's a spider in the bathroom!","V koupelně je pavouk!"),
 'camera': ("Whose is this camera? It's mine.","Čí je tenhle fotoaparát? Můj."), 'clock': ("Whose is this clock?","Čí jsou tyhle hodiny?"),
 'radio': ("Whose is this radio? It's hers.","Čí je tohle rádio? Její."), 'box': ("Whose is this box?","Čí je tahle krabice?"),
 'phone': ("Whose is this phone? It's yours.","Čí je tenhle telefon? Tvůj."), 'watch': ("Whose is this watch? It's mine.","Čí jsou tyhle hodinky? Moje."),
 'armchair': ("The cat is on the armchair.","Kočka je na křesle."),
 'smell flowers': ("In spring we smell flowers.","Na jaře čicháme ke květinám."), 'plant seeds': ("In spring we plant seeds.","Na jaře sázíme semínka."),
 'finish school': ("In summer we finish school.","V létě končíme školu."), 'eat chestnuts': ("In autumn we eat chestnuts.","Na podzim jíme kaštany."),
 'celebrate Halloween': ("In autumn we celebrate Halloween.","Na podzim slavíme Halloween."), 'wear warm clothes': ("In winter we wear warm clothes.","V zimě nosíme teplé oblečení."),
 'open presents': ("In winter we open presents.","V zimě rozbalujeme dárky."), 'go to the beach': ("In summer we go to the beach.","V létě chodíme na pláž."),
 'birthday': ("When's your birthday?","Kdy máš narozeniny?"), 'mouse': ("There's a mouse in the kitchen!","V kuchyni je myš!"),
 'haunted': ("It's a haunted house.","Je to strašidelný dům."), 'cinema': ("Is there a cinema near here?","Je tady blízko kino?"),
 'from ... to ...': ("How do I get from the bank to the museum?","Jak se dostanu od banky k muzeu?"), 'town': ("I live in a small town.","Bydlím v malém městě."),
 'directions': ("Ask for directions.","Zeptej se na cestu."), 'holiday': ("We're on holiday.","Jsme na prázdninách."),
 'aunt': ("She's my aunt.","To je moje teta."), 'uncle': ("He's my uncle.","To je můj strýc."), 'cousins': ("They're my cousins.","To jsou moji bratranci a sestřenice."),
 "o'clock": ("It's eight o'clock.","Je osm hodin."), 'half past': ("It's half past seven.","Je půl osmé."),
 'a quarter past': ("It's a quarter past eight.","Je čtvrt na devět."), 'a quarter to': ("It's a quarter to nine.","Je tři čtvrtě na devět."),
 'get up': ("I get up at seven o'clock.","Vstávám v sedm hodin."), 'get dressed': ("I get dressed quickly.","Rychle se oblékám."),
 'have breakfast': ("I have breakfast at half past seven.","Snídám v půl osmé."), 'go to school': ("I go to school at eight o'clock.","Do školy jdu v osm hodin."),
 'go to bed': ("I go to bed at nine o'clock.","Jdu spát v devět hodin."), 'daily routine': ("This is my daily routine.","Tohle je můj denní režim."),
 'Harvest Festival': ("We celebrate Harvest Festival in autumn.","Dožínky slavíme na podzim."), 'harvest': ("The harvest is in autumn.","Sklizeň je na podzim."),
 'basket': ("A basket of fruit.","Košík ovoce."), 'fruit': ("I like fruit.","Mám rád ovoce."), 'vegetables': ("Eat your vegetables!","Sněz zeleninu!"),
 'moon': ("Look at the moon!","Podívej na měsíc!"), 'grow': ("Apples grow on trees.","Jablka rostou na stromech."),
 'costume': ("Put on your costume!","Obleč si kostým!"), 'wig': ("I'm wearing a wig.","Mám na sobě paruku."), 'mask': ("It's a scary mask.","Je to strašidelná maska."),
 'cape': ("Superheroes wear capes.","Superhrdinové nosí pláště."), 'parade': ("Join the parade!","Přidej se k průvodu!"), 'hat': ("He's got a dirty hat.","Má špinavý klobouk."),
 'clown': ("I'm a clown!","Jsem klaun!"), 'pirate': ("He's a pirate.","On je pirát."), 'superhero': ("She's a superhero.","Ona je superhrdinka."),
 'competition': ("I won the competition!","Vyhrál jsem soutěž!"),
 'hot': ("It's hot today.","Dnes je horko."), 'the alphabet': ("Say the alphabet.","Řekni abecedu."), 'school subject': ("Maths is a school subject.","Matematika je školní předmět."),
 'jump': ("Jump!","Skoč!"), 'bounce': ("Bounce the ball.","Odraz míč o zem."), 'throw': ("Throw the ball!","Hoď míč!"), 'catch': ("Catch the ball!","Chyť míč!"),
 'ears': ("It's got big ears.","Má velké uši."), 'legs': ("It's got four legs.","Má čtyři nohy."), 'neck': ("A giraffe has got a long neck.","Žirafa má dlouhý krk."),
 'grass': ("The grass is green.","Tráva je zelená."), 'run': ("He's running.","Běží."), 'climb': ("I'm climbing a tree.","Lezu na strom."),
 'swim': ("Are you swimming?","Plaveš?"), 'sail': ("We're sailing on the lake.","Plavíme se na jezeře."), 'ride a bike': ("She's riding a bike.","Jede na kole."),
 'ride a horse': ("He's riding a horse.","Jede na koni."), 'fat': ("He's fat.","On je tlustý."), 'thin': ("She's thin.","Ona je hubená."),
 'short': ("The snowman is short.","Sněhulák je malý."), 'tall': ("My dad is tall.","Táta je vysoký."), 'dry': ("My scarf is dry.","Moje šála je suchá."),
 'eat': ("We're eating.","Jíme."), 'play': ("They're playing.","Hrají si."), 'snowman': ("Let's make a snowman!","Postavme sněhuláka!"),
 'tummy': ("The snowman has got a fat tummy.","Sněhulák má tlusté břicho."),
 'uniform': ("A police officer wears a uniform.","Policista nosí uniformu."), 'helmet': ("A firefighter wears a helmet.","Hasič nosí helmu."),
 'white coat': ("A doctor wears a white coat.","Doktor nosí bílý plášť."), 'boots': ("Firefighters wear boots.","Hasiči nosí boty."), 'job': ("What's your job?","Jaká je tvoje práce?"),
})
MANUAL_EXAMPLES.update({
 "I'll take it.": ("How much is it? Fifty cents. I'll take it.","Kolik to stojí? Padesát centů. Vezmu si to."),
 'Queen': ("The Queen likes pancakes.","Královna má ráda palačinky."),
 'How much are these?': ("How much are these tomatoes? They're forty cents.","Kolik stojí tahle rajčata? Čtyřicet centů."),
 'pancake': ("Can I have a pancake, please?","Můžu dostat palačinku, prosím?"), 'bowl': ("Put the flour in the bowl.","Dej mouku do mísy."),
 'mix': ("Mix the eggs and the flour.","Zamíchej vejce a mouku."), 'at the same time': ("Add the sugar and mix at the same time.","Přidej cukr a zároveň míchej."),
 'slice': ("A slice of bread, please.","Krajíc chleba, prosím."), 'add': ("Add some sugar.","Přidej trochu cukru."),
 'carrots': ("How much are these carrots?","Kolik stojí tyhle mrkve?"), 'peach': ("Can I have a peach, please?","Můžu dostat broskev, prosím?"),
 'put': ("Put the pancake on the plate.","Dej palačinku na talíř."),
})
MANUAL_EXAMPLES_UNIT = {
 ('p3-time','clock'): ("Look at the clock. It's three o'clock.","Podívej na hodiny. Jsou tři hodiny."),
 ('p3-time','play'): ("I play after school.","Po škole si hraju."),
 ('fest-carnival','hat'): ("Wear a hat!","Vezmi si klobouk!"),
 ('u1-move-your-body','walk'): ("Walk, don't run!","Jdi, neběhej!"),
}

# 5. SABLONY PRIKLADU PODLE UNITU (jen pro slova bez rucniho prikladu)
UNCOUNT = {'bread','yoghurt','flour','sugar','sand','mud','water','hair','glass','grass','fruit','meat'}
SEASONS = {'spring','summer','autumn','winter'}
MONTHS = {'January','February','March','April','May','June','July','August','September','October','November','December'}
ROOMS = {'flat','house','living room','kitchen','bathroom','bedroom','dining room','hall','garden','garage'}
ORD = {'first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth',
       'fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth','twenty-first','twenty-second','twenty-third','thirtieth'}
SPORT_PLAY = {'football','basketball','baseball','volleyball','hockey','tennis'}
SUBJECTS = {'Music','Arts and crafts','Maths','ICT','Science','PE','English','Spanish','Arts and Crafts'}
ANIMALS3 = {'crocodile','lion','snake','monkey','penguin','elephant','lizard','giraffe','hippo','tiger','hedgehog','fox','squirrel'}
PETS = {'cat','dog','guinea pig','hamster','parrot','turtle','stick insect','fish','rabbit','spider'}
FOOD_SG = {'pineapple','carrot','potato','tomato','peach','lemon','apple'}
FOOD_PL = {'potatoes','tomatoes','green beans','sweets','carrots'}
NUMS = {'ten':'deset','twenty':'dvacet','thirty':'třicet','forty':'čtyřicet','fifty':'padesát'}
HOUSE_OBJ = {'camera','clock','radio','box','phone','watch','armchair'}
DAYS = {'Monday':'v pondělí','Tuesday':'v úterý','Wednesday':'ve středu','Thursday':'ve čtvrtek','Friday':'v pátek','Saturday':'v sobotu','Sunday':'v neděli'}
MONTHS_CZ_LOC = {'January':'v lednu','February':'v únoru','March':'v březnu','April':'v dubnu','May':'v květnu','June':'v červnu',
  'July':'v červenci','August':'v srpnu','September':'v září','October':'v říjnu','November':'v listopadu','December':'v prosinci'}
SEASON_CZ_LOC = {'spring':'na jaře','summer':'v létě','autumn':'na podzim','winter':'v zimě'}
ROOM_CZ_LOC = {'flat':'v bytě','house':'v domě','living room':'v obývacím pokoji','kitchen':'v kuchyni','bathroom':'v koupelně',
  'bedroom':'v ložnici','dining room':'v jídelně','hall':'v předsíni','garden':'na zahradě','garage':'v garáži'}

def cz_acc(cz):
    """Jednoduchy 4. pad pro zenska na -a (brambora -> bramboru)."""
    base = cz.split(' (')[0].split(',')[0].strip()
    if base.endswith('ová'):
        return base[:-1] + 'ou'
    if base.endswith('a') and not base.endswith('ata'):
        return base[:-1] + 'u'
    return base

def article(en):
    return 'an' if en[0].lower() in 'aeiou' else 'a'

def template_example(unit_id, w):
    en, cz = w['en'], w['cz']
    base_cz = cz.split(' (')[0].split(',')[0].strip()
    if en in SUBJECTS:
        return (f"My favourite subject is {en}.", f"Můj oblíbený předmět je {base_cz}.")
    if en in SPORT_PLAY:
        return (f"I play {en} every day.", f"Hraju {cz_acc(base_cz)} každý den.")
    if en.startswith('go ') and unit_id == 'u1-move-your-body':
        return (f"I {en} on Saturday.", f"V sobotu {base_cz.replace('jít ','chodím ').replace('jet ','jezdím ')}.")
    if en in DAYS:
        return (f"I play tennis on {en}.", f"Hraju tenis {DAYS[en]}.")
    if en in FOOD_SG:
        return (f"Can I have {article(en)} {en}, please?", f"Můžu dostat {cz_acc(base_cz)}, prosím?")
    if en in FOOD_PL or en in UNCOUNT and unit_id == 'u2-lets-go-shopping':
        return (f"Can I have some {en}, please?", f"Můžu dostat {cz_acc(base_cz)}, prosím?")
    if en in NUMS:
        return (f"How much is it? It's {en} cents.", f"Kolik to stojí? {NUMS[en].capitalize()} centů.")
    if en == 'cents':
        return ("It's twenty cents.", "Stojí to dvacet centů.")
    if en in ANIMALS3 or en == 'wild animal':
        return (f"It's {article(en)} {en}. Has it got a tail?", f"Je to {base_cz}. Má ocas?")
    if en in PETS:
        return (f"I've got {article(en)} {en}.", f"Mám {cz_acc(base_cz)}.")
    if en == 'pet':
        return ("Have you got any pets?", "Máš nějaká domácí zvířata?")
    if en in SEASONS:
        return (f"My favourite season is {en}.", f"Moje oblíbené roční období je {base_cz}.")
    if en in MONTHS:
        return (f"My birthday is in {en}.", f"Narozeniny mám {MONTHS_CZ_LOC[en]}.")
    if en in ORD:
        words = base_cz.split(' (')[0].split()
        gen = ' '.join((x[:-1] + 'ého') if x.endswith('ý') else (x + 'ho') if x.endswith('í') else x for x in words)
        return (f"It's the {en} of May.", f"Je {gen} května.")
    if en in ROOMS:
        return (f"There's a clock in the {en}." if en not in ('garden',) else "There are flowers in the garden.",
                f"{ROOM_CZ_LOC[en].capitalize()} jsou hodiny." if en not in ('garden',) else "Na zahradě jsou květiny.")
    if en in HOUSE_OBJ:
        return (f"Whose is this {en}? It's mine.", f"Čí je tohle? ({base_cz}) Moje.")
    if unit_id == 'u6-all-year-round' and w.get('pos') == 'verb':
        return (f"In autumn we {en}.", f"Na podzim {base_cz}. (my)")
    if unit_id == 'p2-jobs':
        return (f"He's {article(en)} {en}.", f"On je {base_cz}.")
    if unit_id == 'p3-time':
        return None
    return None

# 6. POMOCNE FUNKCE
def norm(s):
    s = s.lower().strip()
    s = re.sub(r"[?.!…]", "", s)
    s = re.sub(r"^(it's|its|go|a|an|the|to)\s+", "", s)
    return s.strip()

def singular(s):
    for suf, rep in (('oes','o'),('ies','y'),('ches','ch'),('shes','sh'),('ses','s'),('s','')):
        if s.endswith(suf) and len(s) > len(suf)+2:
            return s[:-len(suf)] + rep
    return s

def slug(s):
    s = s.lower()
    s = s.replace("'", '').replace('’','')
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def match(school_en, book_words):
    k = norm(school_en)
    for bw in book_words:
        bk = norm(bw['en'])
        if bk == k or singular(bk) == singular(k):
            return bw
    best = None
    for bw in book_words:
        bk = norm(bw['en'])
        if len(bk) < 5 or len(k) < 5: continue
        if re.search(r'\b' + re.escape(bk) + r'\b', k) or re.search(r'\b' + re.escape(k) + r'\b', bk):
            if best is None or len(bk) > len(norm(best['en'])):
                best = bw
    return best

# 7. MERGE
def main():
    d = json.load(open(SRC, encoding='utf-8'))
    units_by_id = {u['id']: u for u in d['units']}
    all_ids = set()
    prefix_of = {'s-back-to-school':'s','u1-move-your-body':'u1','u2-lets-go-shopping':'u2','u3-at-the-zoo':'u3','p1-pets':'p1',
                 'u4-the-nature-trail':'u4','u5-the-frozen-lake':'u5','u6-all-year-round':'u6','p2-jobs':'p2','u7-my-house':'u7',
                 'u8-all-around-the-town':'u8','u9-holiday-fun':'u9','p3-time':'p3','fest-harvest':'f1','fest-carnival':'f2'}

    for u in d['units']:
        uid = u['id']; pref = prefix_of[uid]
        book_words = u['words']
        for bw in book_words:
            bw['core'] = False
            bw['source'] = 'book'
            bw.pop('note', None)
        new_words = []
        used = set()
        school_title, school_list = SCHOOL.get(uid, (None, []))
        u['schoolUnit'] = school_title
        for en, cz, pos, emoji in school_list:
            bw = match(en, book_words)
            if bw and id(bw) not in used:
                used.add(id(bw))
                w = bw
                w['bookForm'] = w['en'] if norm(w['en']) != norm(en) else None
                if w['bookForm'] is None: w.pop('bookForm')
                w['en'] = en
                w['cz'] = cz
                w['pos'] = pos
                if emoji: w['emoji'] = emoji
                w['core'] = True; w['source'] = 'school+book'
                w['id'] = f"{pref}-{slug(en)}"
                new_words.append(w)
            else:
                w = {'id': f"{pref}-{slug(en)}", 'en': en, 'cz': cz, 'pos': pos, 'emoji': emoji, 'core': True, 'source': 'school'}
                if en.endswith('s') and pos == 'noun' and en.lower() not in ('chess','glass','mess','tennis','hippos'):
                    w['plural'] = True
                new_words.append(w)
        # bonus slova z ucebnice, ktera skola nema
        for bw in book_words:
            if id(bw) in used: continue
            bw['id'] = f"{pref}-{slug(bw['en'])}"
            new_words.append(bw)
        # dedup id
        seen = {}
        for w in new_words:
            base = w['id']; i = 2
            while w['id'] in seen or w['id'] in all_ids:
                w['id'] = f"{base}-{i}"; i += 1
            seen[w['id']] = True; all_ids.add(w['id'])
        # priklady
        for w in new_words:
            ex = MANUAL_EXAMPLES_UNIT.get((uid, w['en'])) or MANUAL_EXAMPLES.get(w['en'])
            if ex is None:
                ex = template_example(uid, w)
            w['examples'] = [{'en': ex[0], 'cz': ex[1]}] if ex else []
        u['words'] = new_words
        # fraze
        for p in u['phrases']:
            p['core'] = True; p['source'] = 'book'
        for i, (en, cz, pat) in enumerate(EXTRA_PHRASES.get(uid, []), start=1):
            pid = f"{pref}-ph-x{i}"
            while pid in all_ids: pid += 'b'
            all_ids.add(pid)
            u['phrases'].append({'id': pid, 'en': en, 'cz': cz, 'pattern': pat, 'core': True, 'source': 'dialogue'})

    d['schemaVersion'] = 2
    d['updatedAt'] = datetime.date.today().isoformat()
    d['source'] = "Give Me Five! 2 (Macmillan) – Pupil's Book + Activity Book + školní sešit slovíček"
    d['legend'] = {'core': 'slovo ze školního sešitu (jádro, zkoušeno ve škole)', 'bonus': 'slovo navíc z učebnice (core=false)'}
    json.dump(d, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    # 8. SUMMARY MD
    L = []
    L.append('# English Stars – slovíčka a fráze (v2, sloučeno se školním sešitem)\n')
    L.append(f"Aktualizováno {d['updatedAt']}. **Tučně** = jádro ze školního sešitu, obyčejně = bonus z učebnice. U každého slova příklad věty.\n")
    tw = tp = tc = 0
    for u in d['units']:
        core = [w for w in u['words'] if w['core']]; bonus = [w for w in u['words'] if not w['core']]
        tw += len(u['words']); tc += len(core); tp += len(u['phrases'])
        L.append(f"\n## {u['code']} – {u['title']} (učebnice str. {u['pages']}{', sešit: ' + u['schoolUnit'] if u.get('schoolUnit') else ''})\n")
        if u.get('todo'): L.append(f"> ⚠️ {u['todo']}\n")
        L.append(f"**Slovíčka ({len(core)} jádro + {len(bonus)} bonus):**\n")
        for w in core:
            ex = f" — _{w['examples'][0]['en']}_" if w['examples'] else ''
            L.append(f"- **{w['en']}** – {w['cz']}{' ' + w['emoji'] if w.get('emoji') else ''}{ex}")
        for w in bonus:
            ex = f" — _{w['examples'][0]['en']}_" if w['examples'] else ''
            L.append(f"- {w['en']} – {w['cz']}{' ' + w['emoji'] if w.get('emoji') else ''}{ex}")
        L.append(f"\n**Fráze ({len(u['phrases'])}):**\n")
        for p in u['phrases']:
            L.append(f"- {p['en']} – {p['cz']}")
    L.insert(2, f"\nCelkem: **{tw} slov** ({tc} jádro) a **{tp} frází** v {len(d['units'])} oddílech.\n")
    open(OUT_MD, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    noex = [(u['code'], w['en']) for u in d['units'] for w in u['words'] if not w['examples']]
    print(f"units={len(d['units'])} words={tw} core={tc} phrases={tp} words_without_example={len(noex)}")
    print(noex[:80])

if __name__ == '__main__':
    main()
