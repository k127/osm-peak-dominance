# osm-peak-dominance
For each Openstreetmap peak, calculate its dominance using grass GIS with SRTM DEM data

# Topographic Isolation in OSM

## Workflow

* query Openstreetmap Overpass API `natural=peak` within a bbox
* for each peak,
    * calculate topographic isolation (`r.li.dominance`)
    * if necessary, download SRTM tile(s)
    * add tag to OSM node **TODO: propose scheme**


## Goal
<img src="https://upload.wikimedia.org/wikipedia/commons/0/05/DominanzSchartenhoeheNew.png"
     align="right" width="50%"
     alt="Topographic isolation (Dominanz) and topographic prominence (Schartenhöhe)"/>

Peaks (mountain summits) are attributed with a dominance weight („Dominanz“) which then can be of interest for map rendering.
A peak of a higher dominance takes label rendering precedence over a less dominant peak.


## Outlook

* Grouping peaks of "the same" mountain by determining their topographic prominence („Schartenhöhe“)


## References

* [Topographic isolation](https://en.wikipedia.org/wiki/Topographic_isolation) / [de](https://de.wikipedia.org/wiki/Dominanz_(Geographie))
* [Topographicprominence](https://en.wikipedia.org/wiki/Topographic_prominence) / [de](https://de.wikipedia.org/wiki/Schartenh%C3%B6he)


## Credits

* Image by [Gretarsson](https://commons.wikimedia.org/wiki/User:Gretarsson),
  licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
