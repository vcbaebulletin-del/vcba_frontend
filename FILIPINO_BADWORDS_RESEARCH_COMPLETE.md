# Filipino Bad Words - Comprehensive Research & Implementation

## Research Date
October 22, 2025

## Research Sources
1. **Wikipedia** - Tagalog Profanity (comprehensive academic source)
2. **Lingopie** - "30+ Tagalog Swear Words And Curses That'll Leave You Speechless"
3. **BuzzFeed** - "16 Totally Useful Filipino Swear Words And How To Use Them"
4. **Reddit r/Tagalog** - Community discussions on Tagalog swear words
5. **Bisdak Words** - Common Bisaya/Visayan swear words

## Final Count
- **Initial Filipino words**: 13
- **After first research**: 74
- **After comprehensive research**: **127 words/phrases**
- **English bad words**: 404
- **Total bad words in system**: **531**

## Categories of Filipino Bad Words

### 1. Mother-Related Insults (Most Severe) - 13 entries
The most offensive category in Filipino culture, attacking someone's mother:
- `puta`, `puta ka` - whore, you're a whore
- `putang ina`, `putang ina mo` - your mother is a whore
- `tang ina`, `tangina`, `tangina mo`, `taena` - shortened versions
- `anak ka ng puta` - son/daughter of a whore
- `puking ina`, `kingina`, `amputa` - variations
- `puke ng ina mo` - extremely vulgar reference to mother's genitalia

### 2. Genitalia Terms (Explicit) - 17 entries
Direct references to sexual organs:
- **Male**: `burat`, `bayag`, `titi`, `otin`, `supot`, `supot ka`
- **Female**: `puki`, `kiki`, `pipi`, `kikay`, `kiffy`, `pekpek`, `tinggil`
- **Other**: `suso`, `boob`, `puwit`, `tuli`

### 3. Sexual Acts (Explicit) - 17 entries
Terms for sexual intercourse and related activities:
- `kantot`, `kantutan`, `hindut` - intercourse (vulgar)
- `jakol`, `lulu`, `salsal`, `bato`, `bati` - masturbation
- `tsupa`, `brotsa` - oral sex
- `an-an`, `uring` - anal intercourse
- `magpadilig`, `pagdidilig` - euphemisms for sex
- `uhaw`, `ginamit` - sexual metaphors
- `isinuko ang bataan` - losing virginity

### 4. Stupidity Insults - 16 entries
Calling someone stupid or foolish:
- `bobo`, `boba`, `bobo ka` - dumb/stupid
- `tanga` - foolish
- `gago`, `gaga`, `gago ka`, `gaga ka`, `gagi` - stupid/fool
- `ogag`, `ogag ka` - same as gago
- `kagaguhan` - foolishness
- `ungas` - dimwit
- `bugok`, `botlog` - stupid/foolish
- `nognog` - derogatory

### 5. Crazy/Insane Insults - 11 entries
Implying mental instability:
- `ulol`, `ulol ka`, `ulul` - crazy/rabid
- `bulol`, `bulol ka` - stutterer/crazy
- `kaululan` - craziness
- `loko` - crazy
- `sira ulo`, `sira ulo ka` - broken head/you're crazy
- `buang` - insane
- `nakakagago` - makes you feel stupid

### 6. Troublemaker/Jerk Insults - 11 entries
For people who cause trouble:
- `tarantado`, `tado` - idiot/jerk
- `kupal`, `kupal ka` - scumbag (literally smegma)
- `hinayupak`, `hinayupak ka` - acts like an animal
- `hayop`, `hayop ka`, `hayup` - animal/beast
- `animal ka`, `mga hayop kayo` - you're animals

### 7. Devil/Curse Words (Visayan) - 3 entries
From Visayan/Bisaya dialects:
- `yawa` - devil
- `pesteng yawa`, `pisting yawa` - devil pest

### 8. Annoyance/Nuisance - 9 entries
Expressing frustration:
- `buwisit`, `bwiset`, `buset` - nuisance/bad luck
- `leche`, `lechugas`, `letse` - damn/crap
- `lintik` - lightning (wishing someone struck)
- `malilintikan`, `malilintikan ka` - get damned

### 9. Damn/Asshole Equivalents - 4 entries
Strong insults:
- `punyeta`, `mga punyeta kayo`, `punyeta ka` - asshole/damn
- `hudas` - traitor (from Judas)

### 10. Milder Curses - 11 entries
Less offensive but still vulgar:
- `pucha`, `puchanggala`, `puchangina` - darn/shoot
- `pakshet` - Filipino "fuck" + "shit"
- `pakyu`, `pakyu ka` - Filipino "fuck you"
- `putik`, `potek` - mud (mild expletive)
- `syet`, `shet` - Filipino "shit"
- `putragis` - milder "putang ina"

### 11. Worthless/Shameless - 4 entries
Attacking character:
- `wala kang kwenta` - you're worthless
- `walang hiya`, `walang hiya ka` - shameless
- `batugan` - lazy/good-for-nothing

### 12. Excrement - 5 entries
Feces-related:
- `tae`, `dumi` - feces/poop
- `kumain tae`, `kainin mo tae ko`, `kainin mo ang tae` - eat shit

### 13. Blasphemous - 2 entries
Religious profanity:
- `susmaryosep` - Jesus, Mary, Joseph
- `sus` - Jesus (shortened)

### 14. Other Vulgar Terms - 2 entries
- `ratbu`, `nakakaburat` - variations related to male anatomy

## Implementation Details

### Files Updated
1. **`src/data/bad-words/filipino_badwords.txt`**
   - Now contains 127 words/phrases
   - One entry per line
   - Includes all categories

2. **`src/utils/badWordFilter.ts`**
   - Updated `FILIPINO_BAD_WORDS` array with all 127 entries
   - Organized by category with comments for maintainability
   - Case-insensitive matching
   - Supports multi-word phrases

### How It Works
The filter performs:
1. **Case normalization**: "GAGO" → "gago"
2. **Punctuation removal**: "Gago!" → "gago"
3. **Word splitting**: Checks each word individually
4. **Phrase matching**: Also checks for multi-word bad phrases like "putang ina mo"

### Example Detections
✅ **Will Block**:
- "Gago ka!" → Detected: "gago ka"
- "PUTANG INA MO!!!" → Detected: "putang ina mo"
- "Pesteng yawa talaga" → Detected: "pesteng yawa"
- "Bobo ka naman" → Detected: "bobo ka"
- "Pakshet!" → Detected: "pakshet"

✅ **Will Allow**:
- "Magandang umaga" (Good morning)
- "Salamat po" (Thank you)
- "Kumusta ka" (How are you)

## Cultural Notes

### Severity Levels
1. **Extremely Offensive**: Mother insults, explicit sexual terms
2. **Highly Offensive**: Stupidity/crazy insults, genitalia references
3. **Offensive**: Troublemaker/jerk insults
4. **Moderately Offensive**: Annoyance expressions, milder curses

### Regional Variations
- **Tagalog**: Most common in Manila and Luzon
- **Visayan/Bisaya**: Common in Visayas and Mindanao (e.g., "yawa")
- **Spanish-derived**: Many words borrowed from Spanish colonial period

### Context Matters
- Some words like "hayop" (animal) can be neutral in context
- Tone and delivery significantly affect offensiveness
- Among close friends, some terms may be used playfully
- In formal settings, ALL these words are inappropriate

## Testing Recommendations

### Test Cases for Filipino Bad Words
1. **Direct usage**: "Gago ka" → Should block ✅
2. **With punctuation**: "Putang ina!!!" → Should block ✅
3. **Mixed case**: "TARANTADO ka" → Should block ✅
4. **Multi-word phrases**: "pesteng yawa naman" → Should block ✅
5. **Embedded in sentence**: "Ang bobo mo" → Should block ✅
6. **Clean Filipino**: "Kumusta ka" → Should allow ✅

## References
- Wikipedia: Tagalog Profanity (academic source)
- Lingopie Blog: Tagalog Swear Words Guide
- BuzzFeed: Filipino Swear Words Article
- Reddit r/Tagalog: Community discussions
- Bisdak Words: Bisaya/Visayan profanity

## Maintenance Notes
- List is comprehensive but not exhaustive
- New slang terms may emerge over time
- Consider periodic reviews and updates
- User reports can help identify missing terms

---

**Implementation Complete**: October 22, 2025
**Total Bad Words**: 531 (404 English + 127 Filipino)
**Status**: ✅ Ready for production use
