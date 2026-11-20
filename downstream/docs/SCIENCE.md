# Science — Downstream!

> **Integrity rule:** player-facing text may only use statements marked **Verified** below, and only after
> the research team has reviewed them. Never add findings, numbers, biographies, quotations, or endorsements that
> aren't in a cited source. Add an open question instead.

**Status (2026-11-19):** the three sources below were read in full. **None of them cites a peer-reviewed paper.**
A search for primary literature, and review by the NC State / NC Sea Grant team, are pending.

Labels: **Verified** = stated in a cited source · **Ambiguous** = the sources disagree or are unclear · **Abstraction** = our gameplay invention.

## Sources

| Key         | Source                                                                                                                                                                                                                                                                                | Date / byline                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| PBS-NC 2025 | _Tracking Trash to Discover the Path of Plastic_, PBS North Carolina (Sci NC blog). https://www.pbsnc.org/blogs/science/tracking-trash-to-discover-the-path-of-plastic/                                                                                                               | Published June 27, 2025 · Frank Graff |
| NCSG        | _Reducing Litter in Urban Waterways_, North Carolina Sea Grant project page. https://ncseagrant.ncsu.edu/reducing-litter-in-urban-waterways/                                                                                                                                          | No date or byline shown               |
| WUNC 2026   | _Weird Science: Research using everyday trash to figure out how litter travels from city streets to the ocean_, WUNC / Public Radio East. https://www.wunc.org/2026-05-08/weird-science-research-using-everyday-trash-to-figure-out-how-litter-travels-from-city-streets-to-the-ocean | May 8, 2026 · Annette Weston          |

## Verified statements

| #   | Statement (paraphrased)                                                                                                      | Source(s)          | Notes                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| 1   | NC State researchers released 40 GPS-equipped plastic bottles into creeks in Raleigh, NC                                     | PBS-NC, NCSG, WUNC | PBS: the first test put 10 in Marsh Creek and 10 in Crabtree Creek                             |
| 2   | An NC State doctoral student runs much of the trash-tracking research (name withheld pending permission)                     | PBS-NC, WUNC       | Name withheld until the researcher approves                                                    |
| 3   | An NC State faculty member is the project manager per WUNC (name withheld pending permission)                                | PBS-NC, WUNC       | **Ambiguous:** the title differs between sources                                               |
| 4   | The project is led by NC State and North Carolina Sea Grant                                                                  | WUNC, NCSG         | NCSG lists partners including Wake County, City of Raleigh, and others                         |
| 5   | Some bottles travelled almost 25 miles in a few weeks                                                                        | PBS-NC             | Do not turn into game speeds                                                                   |
| 6   | Rainfall makes a big difference both in sending litter into the creek and in how far it travels (project researcher, quoted) | PBS-NC             | Qualitative basis for the rain mechanic                                                        |
| 7   | Three trash trap devices were installed in Marsh Creek to catch plastic before it flows downstream                           | NCSG               | Basis for the trash-trap equipment                                                             |
| 8   | Volunteers and students remove, sort, and log the trash collected                                                            | NCSG               | Basis for the cleanup crews                                                                    |
| 9   | Bottles carry a QR code. Finders are asked to scan it, report the location, and leave the bottle where it is                 | PBS-NC, WUNC       | Ending: never encourage releasing bottles                                                      |
| 10  | Bottles are pink (image captions); a researcher quote mentions "pink or orange" bottles                                      | PBS-NC, NCSG, WUNC | Game uses pink for research bottles                                                            |
| 11  | A public map shows the bottles' paths                                                                                        | PBS-NC, NCSG, WUNC | **Ambiguous:** whether it is live or historical. Two different ArcGIS links appear (see below) |
| 12  | Much of the litter loading comes from urban areas (researcher, paraphrased)                                                  | WUNC               | Qualitative basis for urban litter sources                                                     |
| 13  | The project also surveys streets for trash hot spots and aims to build a community toolkit of strategies                     | NCSG, WUNC         | Basis for prevention (bins) as a strategy                                                      |

Public links mentioned in the sources (verify each before using in the ending):

- Bottle tracker (NCSG, WUNC): https://experience.arcgis.com/experience/278d52348842440ea00805a4cb0d470d
- "Trash Tracker" dashboard (PBS-NC): https://www.arcgis.com/apps/dashboards/cb1da154c2374349b757f814954bc410
- Trash-trap dashboard (NCSG): https://www.arcgis.com/apps/dashboards/026f977f7aac4306989071b91f72b002

## Expert feedback (personal communication)

From a member of the research team who playtested the game (name withheld until they approve being credited).
Treat as expert guidance, pending written confirmation.

- Trash typically only moves when it rains, and flow mostly increases with rain. Exceptions include dams and
  large water bodies, where wind and tides also move litter.
- Rain washing litter off the land should be visible, not just shown in a weather bar.
- The different litter rates from different places felt accurate.
- Toys and balls are a common find in rivers.
- Call the drain device a "storm drain filter".

## Science → mechanic mapping

| Mechanic                                                                                  | Inspired by               | Status                                  | Intentional simplifications                                                   |
| ----------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Litter waits on land; rain washes it in and speeds the water up (dry: almost no movement) | Expert feedback above; #6 | Expert feedback (pending confirmation)  | Wash rates and flow multipliers are invented                                  |
| Urban litter sources + runoff into the creek                                              | #6, #12                   | Verified (qualitative)                  | Constant generation rates; fixed runoff delays; litter categories cosmetic    |
| Trash bins (prevent at source)                                                            | #13                       | Verified (as a strategy)                | Fixed 70% effectiveness. Real prevention effectiveness is unknown here        |
| Trash traps (intercept, finite capacity)                                                  | #7, #8                    | Verified (that traps exist)             | Capacity 40 items, coverage across the channel, perfect catch within coverage |
| GPS research bottles (Milestone 4)                                                        | #1, #10, #11              | Verified                                | Virtual bottles only; never counted as litter                                 |
| Rain events (Milestone 5)                                                                 | #6                        | Verified (qualitative)                  | Rain multipliers are invented                                                 |
| Cleanup crews (Milestone 8)                                                               | #8                        | Verified (that volunteers remove trash) | Instant removal                                                               |
| Current faster mid-channel                                                                | —                         | **Abstraction**                         | Placeholder parabola, not hydrology                                           |

**All numbers** (rates, speeds, capacities, effectiveness, targets) are fictional balancing values in
`src/config/tuning.ts` and `src/levels/*.ts`. They are not calibrated predictions for any real waterway.

## Open questions for the research team

- Are there peer-reviewed papers or reports from this project that we should cite?
- Approval of the researchers' names, titles, and any portrait, bio, or quote (none used until approved).
- Is the public tracker live or historical, and which link is canonical?
- Which plain-language findings are you comfortable seeing in the ending (e.g., rainfall and travel distance)?
- Is the "prevention vs. interception" framing a fair representation of the toolkit's goals?

## Climates (year-long levels)

Millbrook is a made-up town. Players choose a climate based on real regions, which sets the shape of the year.
Month-by-month patterns are **simplified for play** (one shower per rainy month, made-up intensities).

| Climate                            | What the source says                                                                                                                                                         | Source                                                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four Seasons (like North Carolina) | Precipitation is generally highest in summer, driven by thunderstorms and tropical systems; fall is the driest season.                                                       | NOAA NCEI State Climate Summaries, North Carolina: https://statesummaries.ncics.org/chapter/nc/                                                                               |
| Four Seasons                       | The Atlantic hurricane season runs from June 1 to November 30.                                                                                                               | NOAA National Hurricane Center: https://www.nhc.noaa.gov/climo/                                                                                                               |
| Monsoon (like South Asia)          | The southwest monsoon normally sets in over Kerala around 1 June and covers the whole country around 15 July; it withdraws from the southern peninsula only after 1 October. | India Meteorological Department: https://mausam.imd.gov.in/responsive/monsooninformation_onset.php and https://mausam.imd.gov.in/responsive/monsooninformation_withdrawal.php |

**Abstraction:** the length of the Monsoon dry stretch and every month's rain intensity are gameplay choices, not data.
No source used here gives a share of yearly rainfall, so the game doesn't claim one.

## Links used in the game

Every link in the ending (`src/content/science.ts`) must appear here; a test checks this.

- https://ncseagrant.ncsu.edu/reducing-litter-in-urban-waterways/ (NC Sea Grant project page)
- https://www.pbsnc.org/blogs/science/tracking-trash-to-discover-the-path-of-plastic/ (PBS North Carolina story)
- https://experience.arcgis.com/experience/278d52348842440ea00805a4cb0d470d (bottle tracker map linked from the NC Sea Grant page; whether it is live or historical is unclear)
- https://raleighcleanup.org/ (Great Raleigh Cleanup, listed as a project partner)
