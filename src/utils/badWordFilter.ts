/**
 * Bad Word Filter Utility
 * 
 * Provides functionality to check if text contains offensive words
 * from English and Filipino bad word lists.
 */

// Hardcoded bad words lists for frontend validation
// Note: The actual files are located at:
// - src/data/bad-words/english_badwords.txt
// - src/data/bad-words/filipino_badwords.txt

const ENGLISH_BAD_WORDS = [
  '2g1c', '2 girls 1 cup', 'acrotomophilia', 'alabama hot pocket', 'alaskan pipeline',
  'anal', 'anilingus', 'anus', 'apeshit', 'arsehole', 'ass', 'asshole', 'assmunch',
  'auto erotic', 'autoerotic', 'babeland', 'baby batter', 'baby juice', 'ball gag',
  'ball gravy', 'ball kicking', 'ball licking', 'ball sack', 'ball sucking', 'bangbros',
  'bangbus', 'bareback', 'barely legal', 'barenaked', 'bastard', 'bastardo', 'bastinado',
  'bbw', 'bdsm', 'beaner', 'beaners', 'beaver cleaver', 'beaver lips', 'beastiality',
  'bestiality', 'big black', 'big breasts', 'big knockers', 'big tits', 'bimbos',
  'birdlock', 'bitch', 'bitches', 'black cock', 'blonde action', 'blonde on blonde action',
  'blowjob', 'blow job', 'blow your load', 'blue waffle', 'blumpkin', 'bollocks',
  'bondage', 'boner', 'boob', 'boobs', 'booty call', 'brown showers', 'brunette action',
  'bukkake', 'bulldyke', 'bullet vibe', 'bullshit', 'bung hole', 'bunghole', 'busty',
  'butt', 'buttcheeks', 'butthole', 'camel toe', 'camgirl', 'camslut', 'camwhore',
  'carpet muncher', 'carpetmuncher', 'chocolate rosebuds', 'cialis', 'circlejerk',
  'cleveland steamer', 'clit', 'clitoris', 'clover clamps', 'clusterfuck', 'cock',
  'cocks', 'coprolagnia', 'coprophilia', 'cornhole', 'coon', 'coons', 'creampie',
  'cum', 'cumming', 'cumshot', 'cumshots', 'cunnilingus', 'cunt', 'darkie', 'date rape',
  'daterape', 'deep throat', 'deepthroat', 'dendrophilia', 'dick', 'dildo', 'dingleberry',
  'dingleberries', 'dirty pillows', 'dirty sanchez', 'doggie style', 'doggiestyle',
  'doggy style', 'doggystyle', 'dog style', 'dolcett', 'domination', 'dominatrix',
  'dommes', 'donkey punch', 'double dong', 'double penetration', 'dp action', 'dry hump',
  'dvda', 'eat my ass', 'ecchi', 'ejaculation', 'erotic', 'erotism', 'escort', 'eunuch',
  'fag', 'faggot', 'fecal', 'felch', 'fellatio', 'feltch', 'female squirting', 'femdom',
  'figging', 'fingerbang', 'fingering', 'fisting', 'foot fetish', 'footjob', 'frotting',
  'fuck', 'fuck buttons', 'fuckin', 'fucking', 'fucktards', 'fudge packer', 'fudgepacker',
  'futanari', 'gangbang', 'gang bang', 'gay sex', 'genitals', 'giant cock', 'girl on',
  'girl on top', 'girls gone wild', 'goatcx', 'goatse', 'god damn', 'gokkun',
  'golden shower', 'goodpoop', 'goo girl', 'goregasm', 'grope', 'group sex', 'g-spot',
  'guro', 'hand job', 'handjob', 'hard core', 'hardcore', 'hentai', 'homoerotic',
  'honkey', 'hooker', 'horny', 'hot carl', 'hot chick', 'how to kill', 'how to murder',
  'huge fat', 'humping', 'incest', 'intercourse', 'jack off', 'jail bait', 'jailbait',
  'jelly donut', 'jerk off', 'jigaboo', 'jiggaboo', 'jiggerboo', 'jizz', 'juggs',
  'kike', 'kinbaku', 'kinkster', 'kinky', 'knobbing', 'leather restraint',
  'leather straight jacket', 'lemon party', 'livesex', 'lolita', 'lovemaking',
  'make me come', 'male squirting', 'masturbate', 'masturbating', 'masturbation',
  'menage a trois', 'milf', 'missionary position', 'mong', 'motherfucker',
  'mound of venus', 'mr hands', 'muff diver', 'muffdiving', 'nambla', 'nawashi',
  'negro', 'neonazi', 'nigga', 'nigger', 'nig nog', 'nimphomania', 'nipple', 'nipples',
  'nsfw', 'nsfw images', 'nude', 'nudity', 'nutten', 'nympho', 'nymphomania',
  'octopussy', 'omorashi', 'one cup two girls', 'one guy one jar', 'orgasm', 'orgy',
  'paedophile', 'paki', 'panties', 'panty', 'pedobear', 'pedophile', 'pegging', 'penis',
  'phone sex', 'piece of shit', 'pikey', 'pissing', 'piss pig', 'pisspig', 'playboy',
  'pleasure chest', 'pole smoker', 'ponyplay', 'poof', 'poon', 'poontang', 'punany',
  'poop chute', 'poopchute', 'porn', 'porno', 'pornography', 'prince albert piercing',
  'pthc', 'pubes', 'pussy', 'queaf', 'queef', 'quim', 'raghead', 'raging boner',
  'rape', 'raping', 'rapist', 'rectum', 'reverse cowgirl', 'rimjob', 'rimming',
  'rosy palm', 'rosy palm and her 5 sisters', 'rusty trombone', 'sadism', 'santorum',
  'scat', 'schlong', 'scissoring', 'semen', 'sex', 'sexcam', 'sexo', 'sexy', 'sexual',
  'sexually', 'sexuality', 'shaved beaver', 'shaved pussy', 'shemale', 'shibari',
  'shit', 'shitblimp', 'shitty', 'shota', 'shrimping', 'skeet', 'slanteye', 'slut',
  's&m', 'smut', 'snatch', 'snowballing', 'sodomize', 'sodomy', 'spastic', 'spic',
  'splooge', 'splooge moose', 'spooge', 'spread legs', 'spunk', 'strap on', 'strapon',
  'strappado', 'strip club', 'style doggy', 'suck', 'sucks', 'suicide girls',
  'sultry women', 'swastika', 'swinger', 'tainted love', 'taste my', 'tea bagging',
  'threesome', 'throating', 'thumbzilla', 'tied up', 'tight white', 'tit', 'tits',
  'titties', 'titty', 'tongue in a', 'topless', 'tosser', 'towelhead', 'tranny',
  'tribadism', 'tub girl', 'tubgirl', 'tushy', 'twat', 'twink', 'twinkie',
  'two girls one cup', 'undressing', 'upskirt', 'urethra play', 'urophilia', 'vagina',
  'venus mound', 'viagra', 'vibrator', 'violet wand', 'vorarephilia', 'voyeur',
  'voyeurweb', 'voyuer', 'vulva', 'wank', 'wetback', 'wet dream', 'white power',
  'whore', 'worldsex', 'wrapping men', 'wrinkled starfish', 'xx', 'xxx', 'yaoi',
  'yellow showers', 'yiffy', 'zoophilia', '🖕'
];

const FILIPINO_BAD_WORDS = [
  // Mother-related insults (most severe)
  'puta', 'puta ka', 'putang ina', 'putang ina mo', 'tang ina', 'tangina', 
  'tangina mo', 'taena', 'anak ka ng puta', 'puking ina', 'kingina', 'amputa',
  'puke ng ina mo',
  
  // Genitalia and sexual terms (explicit)
  'burat', 'bayag', 'puki', 'kiki', 'pipi', 'kikay', 'kiffy', 'pekpek', 
  'tinggil', 'titi', 'otin', 'suso', 'boob', 'puwit', 'tuli', 'supot', 'supot ka',
  
  // Sexual acts (explicit)
  'kantot', 'kantutan', 'hindut', 'jakol', 'lulu', 'salsal', 'bato', 'bati',
  'tsupa', 'brotsa', 'an-an', 'uring', 'magpadilig', 'pagdidilig', 'uhaw',
  'ginamit', 'isinuko ang bataan',
  
  // Stupidity insults
  'bobo', 'boba', 'bobo ka', 'nognog', 'tanga', 'gago', 'gaga', 'gago ka', 
  'gaga ka', 'gagi', 'ogag', 'ogag ka', 'kagaguhan', 'ungas', 'bugok', 'botlog',
  
  // Crazy/insane insults
  'ulol', 'ulol ka', 'ulul', 'bulol', 'bulol ka', 'kaululan', 'loko', 
  'sira ulo', 'sira ulo ka', 'buang', 'nakakagago',
  
  // Troublemaker/jerk insults
  'tarantado', 'tado', 'kupal', 'kupal ka', 'hinayupak', 'hinayupak ka',
  'hayop', 'hayop ka', 'hayup', 'animal ka', 'mga hayop kayo',
  
  // Devil/curse words (Visayan influence)
  'yawa', 'pesteng yawa', 'pisting yawa',
  
  // Annoyance/nuisance
  'buwisit', 'bwiset', 'buset', 'leche', 'lechugas', 'letse', 'lintik',
  'malilintikan', 'malilintikan ka',
  
  // Damn/asshole equivalents
  'punyeta', 'mga punyeta kayo', 'punyeta ka', 'hudas',
  
  // Milder curses
  'pucha', 'puchanggala', 'puchangina', 'pakshet', 'pakyu', 'pakyu ka',
  'putik', 'potek', 'syet', 'shet', 'putragis',
  
  // Worthless/shameless
  'wala kang kwenta', 'walang hiya', 'walang hiya ka', 'batugan',
  
  // Excrement
  'tae', 'dumi', 'kumain tae', 'kainin mo tae ko', 'kainin mo ang tae',
  
  // Blasphemous
  'susmaryosep', 'sus',
  
  // Other vulgar terms
  'ratbu', 'nakakaburat'
];

let badWordsSet: Set<string> | null = null;

/**
 * Load bad words and store them in a Set for fast lookup
 */
function loadBadWords(): Set<string> {
  if (badWordsSet) {
    return badWordsSet;
  }

  badWordsSet = new Set<string>();

  // Add all words to the set (already lowercase)
  [...ENGLISH_BAD_WORDS, ...FILIPINO_BAD_WORDS].forEach(word => {
    badWordsSet!.add(word.toLowerCase());
  });

  console.log(`✅ Loaded ${badWordsSet.size} bad words for filtering`);
  return badWordsSet;
}

/**
 * Normalize text by removing punctuation and converting to lowercase
 * This helps catch bad words even when they're surrounded by punctuation
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

/**
 * Check if the given text contains any bad words
 * 
 * @param text - The text to check
 * @returns true if bad words are found, false otherwise
 */
export function containsBadWords(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const badWords = loadBadWords();
  const normalizedText = normalizeText(text);
  
  // Split text into words
  const words = normalizedText.split(' ');
  
  // Check each word against the bad words set
  for (const word of words) {
    if (badWords.has(word)) {
      console.warn(`⚠️ Bad word detected: "${word}"`);
      return true;
    }
  }

  // Also check for multi-word bad phrases
  for (const badWord of Array.from(badWords)) {
    if (badWord.includes(' ') && normalizedText.includes(badWord)) {
      console.warn(`⚠️ Bad phrase detected: "${badWord}"`);
      return true;
    }
  }

  return false;
}

/**
 * Validate comment text and return error message if bad words are found
 * 
 * @param text - The comment text to validate
 * @returns null if valid, error message string if invalid
 */
export function validateCommentText(text: string): string | null {
  if (containsBadWords(text)) {
    return 'No bad words allowed.';
  }
  return null;
}
