// ==UserScript==
// @name			Hentai Heroes++ League Booster Detector Add-on
// @description		Adding detection of boosters to league.
// @version			0.0.8
// @match			https://www.hentaiheroes.com/*
// @match			https://nutaku.haremheroes.com/*
// @match			https://eroges.hentaiheroes.com/*
// @match			https://thrix.hentaiheroes.com/*
// @match			https://test.hentaiheroes.com/*
// @run-at			document-end
// @updateURL		https://raw.githubusercontent.com/45026831/hh-booster-detector/main/hh-booster-detector.js
// @downloadURL		https://raw.githubusercontent.com/45026831/hh-booster-detector/main/hh-booster-detector.js
// @grant			none
// @author			45026831(Numbers)
// ==/UserScript==

/*	===========
	 CHANGELOG
	=========== */
// 0.0.8: Changing to match new calculations for BDSM
// 0.0.7: Setting an upper limit of 6 on the monostat count calculation
// 0.0.6: Adjusting Jujubes formula to more accurately reflect actual equipment stats
// 0.0.5: Adding booster icons in the table (after checks have run)
// 0.0.4: Adding detection for Jujubes
// 0.0.3: Adding detection for Ginseng
// 0.0.2: Updated Chlorella check to use Alpha's main stat instead of Alpha's Player Class stat
// 0.0.1: Initial version. Adding detection for Chlorella and Cordyceps

// Define jQuery
const {$, location} = window;

// Define CSS
const sheet = (function() {
    const style = document.createElement('style')
    document.head.appendChild(style)
    return style.sheet
})()

const currentPage = location.pathname

const HC = 1
const CH = 2
const KH = 3

if (currentPage.includes('tower-of-fame')) {
    boosterModule()
}

function boosterModule () {
    let opponentLvl
    let opponentEgo
    let opponentHC
    let opponentCH
    let opponentKH
    let opponentMainStat
    let opponentScndStat
    let opponentTertStat
    let opponentAtk
    let opponentDef
    let opponentEndurance
    let opponentHarmony
    let opponentClass
    let opponentMonostatCount
    let opponentHasClub
    let opponentGirlSum

    function getStats() {
        // INIT
        const {playerLeaguesData} = window

        opponentHasClub = !!playerLeaguesData.club.id_club
        opponentLvl = parseInt(playerLeaguesData.level, 10)
        opponentClass = playerLeaguesData.class

        const {caracs} = playerLeaguesData

        opponentEgo = caracs.ego
        opponentHC = caracs.carac1
        opponentCH = caracs.carac2
        opponentKH = caracs.carac3
        opponentEndurance = caracs.endurance
        opponentAtk = caracs.damage
        opponentHarmony = caracs.chance

        opponentGirlSum = playerLeaguesData.team.map(({caracs}) => Object.values(caracs).reduce((s,c) => s+c, 0)).reduce((s,c) => s+c, 0)

        if (opponentClass == HC) {
            opponentMainStat = opponentHC
            opponentScndStat = opponentKH
            opponentTertStat = opponentCH
        }
        if (opponentClass == CH) {
            opponentMainStat = opponentCH
            opponentScndStat = opponentHC
            opponentTertStat = opponentKH
        }
        if (opponentClass == KH) {
            opponentMainStat = opponentKH
            opponentScndStat = opponentCH
            opponentTertStat = opponentHC
        }

        const statRatio = opponentScndStat / opponentMainStat
        // 7+30 - Base secondary stat
        // 9+30 - Base primary stat
        // 7 - per-level of rainbow
        // 6 - max potential monostat
        // 11 - per-level of monostat
        // 4 - difference per-level between monostat and rainbow
        opponentMonostatCount = Math.min(Math.round(
            ((7+30+(7*6)) - ((9+30+(6*7)) * statRatio))
            /
            ((4 * statRatio) + 7)
        ), 6)
    }

    function checkChlorella () {
        const expectedEgo = opponentEndurance + (2 * opponentGirlSum)
        const extraPercent = Math.round(((opponentEgo - expectedEgo) / expectedEgo) * 100)

        console.log(`CHLORELLA CHECK: Expected: ${expectedEgo}, Actual: ${opponentEgo}, Extra: ${extraPercent}%`);

        if (extraPercent > 0) {
            $('#leagues_right div.fighter-stats-container > div:nth-child(2)').addClass('boosted_chlor')
            addIcon('chlor')
        }
    }

    function checkCordyceps () {
        const expectedUnrounded = opponentMainStat + (0.25 * opponentGirlSum)
        const expectedAttack = Math.ceil(expectedUnrounded)
        const extraPercent = Math.round(((opponentAtk - expectedAttack) / expectedAttack) * 100)

        console.log(`CORDYCEPS CHECK: Expected: ${expectedAttack} (Unrounded: ${expectedUnrounded}), Actual: ${opponentAtk}, Extra: ${extraPercent}%`);

        if (extraPercent) {
            $('#leagues_right div.fighter-stats-container > div:nth-child(1)').addClass('boosted_cordy')
            addIcon('cordy')
        }
    }

    function checkGinseng () {
        // 9 free per level, 30 market per level, 10% club boost
        let clubBonus = 1
        if (opponentHasClub) {
            clubBonus = 1.1
        }

        const varianceMultiplier = 1 + (opponentLvl * 0.00005)
        const expectedUnrounded = (opponentLvl * (9 + 30 + ((7 * (6 - opponentMonostatCount)) + (11 * opponentMonostatCount)) * varianceMultiplier)) * clubBonus
        const expectedMainStat = Math.ceil(expectedUnrounded)
        const extraPercent = Math.round(((opponentMainStat - expectedMainStat) / expectedMainStat) * 100)

        console.log(`GINSENG CHECK: Expected: ${expectedMainStat}, Actual: ${opponentMainStat}, Extra: ${extraPercent}%, Monostat count: ${opponentMonostatCount}, Has club: ${opponentHasClub}`);

        if (extraPercent > 0) {
            $('#leagues_right div.fighter-stats-container > div:nth-child(3)').addClass('boosted_ginseng')
            addIcon('ginseng')
        }
    }

    function checkJujubes () {
        let clubBonus = 1
        if (opponentHasClub) {
            clubBonus = 1.1
        }

        const expectedUnrounded = ((opponentScndStat + opponentTertStat) * 0.5 * clubBonus) + ((6 - opponentMonostatCount) * Math.ceil(90 + (opponentLvl * 9.1)))
        const expectedHarmony = Math.ceil(expectedUnrounded)
        const extraPercent = Math.round(((opponentHarmony - expectedHarmony) / expectedHarmony) * 100)

        console.log(`JUJUBES CHECK: Expected: ${expectedHarmony}, Actual: ${opponentHarmony}, Extra: ${extraPercent}%, Monostat count: ${opponentMonostatCount}, Has club: ${opponentHasClub}`);

        if (extraPercent > 0) {
            $('#leagues_right div.fighter-stats-container > div:nth-child(4)').addClass('boosted_jujubes')
            addIcon('jujubes')
        }
    }

    function setupIconHolder () {
        let iconHolder = $('.leadTable .lead_table_default .booster_icons')

        if (!iconHolder.length) {
            iconHolder = $('<span class="booster_icons"></span>')
            $('.leadTable .lead_table_default .nickname').append(iconHolder)
        }

        iconHolder.empty()
    }

    function addIcon (type) {
        $('.leadTable .lead_table_default .booster_icons').append(`<span class="booster_icon boosted_${type}"></span>`)
    }

    function checkBoosters () {
        setupIconHolder()
        getStats()
        checkChlorella()
        checkCordyceps()
        checkGinseng()
        checkJujubes()
    }
    checkBoosters()

    // Observer grabbed from HH++
    let opntName;
    $('.leadTable').click(function() {
        opntName=''
    })
    function waitOpnt() {
        setTimeout(function() {
            if (JSON.parse($('#leagues_right .team-member > img').attr('new-girl-tooltip-data'))) {
                sessionStorage.setItem('opntName', opntName);
                checkBoosters();
            }
            else {
                waitOpnt()
            }
        }, 50);
    }
    const observeCallback = function() {
        const opntNameNew = $('#leagues_right .player_block .title')[0].innerHTML
        if (opntName !== opntNameNew) {
            opntName = opntNameNew;
            waitOpnt();
        }
    }
    const observer = new MutationObserver(observeCallback);
    const test = document.getElementById('leagues_right');
    observer.observe(test, {attributes: false, childList: true, subtree: false});

    sheet.insertRule(`
    #leagues_right .boosted_chlor, #leagues_right .boosted_cordy, #leagues_right .boosted_ginseng, #leagues_right .boosted_jujubes {
        color: #FF2F2F;
    }
    `);
    sheet.insertRule(`
    .leadTable .booster_icons {
        display: inline-flex;
        flex: 1;
        margin: 0 !important;
        align-items: center;
        justify-content: flex-end;
    }
    `);
    sheet.insertRule(`
    .leadTable .booster_icon {
        background-size: contain;
        background-position-y: center;
        background-repeat: no-repeat;
        height: 20px;
        max-width: 20px;
        flex: 1;
        margin: 0 !important;
    }
    `);

    const icons = {
        ginseng: 'https://hh.hh-content.com/pictures/items/B1.png',
        jujubes: 'https://hh.hh-content.com/pictures/items/B2.png',
        chlor: 'https://hh.hh-content.com/pictures/items/B3.png',
        cordy: 'https://hh.hh-content.com/pictures/items/B4.png'
    }

    Object.keys(icons).forEach(booster => {
        sheet.insertRule(`
        .leadTable .boosted_${booster} {
            background: url('${icons[booster]}');
        }
        `)
    })

    sheet.insertRule(`
    .lead_table table tbody tr>td .nickname {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
    }
    `);
}
