'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Representative {
    id: string;
    name: string;
    title: string;
    party: 'Democrat' | 'Republican' | 'Independent';
    jurisdiction: 'State' | 'County' | 'City' | 'School District';
    imageUrl?: string;
    district?: string;
    state?: string;
    biography?: string;
    email?: string;
    website?: string;
    address?: string;
    termStart?: string;
    termEnd?: string;
    socialMedia?: {
        twitter?: string;
        facebook?: string;
        instagram?: string;
        linkedin?: string;
    };
}

// Mock data for elected officials - 40 total (10 per jurisdiction)
const representatives: Representative[] = [
    // STATE LEVEL OFFICIALS (10)
    {
        id: '1',
        name: 'Sarah Martinez',
        title: 'State Senator',
        party: 'Democrat',
        jurisdiction: 'State',
        district: 'District 12',
        state: 'California',
        biography: 'Senator Martinez has served California for 8 years, focusing on education reform and environmental protection. Former public school teacher with a passion for social justice.',
        email: 'senator.martinez@ca.gov',
        website: 'https://martinez.senate.ca.gov',
        address: '1021 O Street, Suite 8610, Sacramento, CA 95814',
        termStart: '2020-01-06',
        termEnd: '2024-12-03',
        socialMedia: {
            twitter: '@SenMartinezCA',
            facebook: 'SenatorSarahMartinez',
            instagram: '@sarahmartinez_ca',
            linkedin: 'sarah-martinez-ca'
        }
    },
    {
        id: '2',
        name: 'Michael Chen',
        title: 'State Assembly Member',
        party: 'Republican',
        jurisdiction: 'State',
        district: 'District 45',
        state: 'Texas',
        biography: 'Assembly Member Chen advocates for small business growth and fiscal responsibility. Former entrepreneur and community leader with 12 years of public service.',
        email: 'michael.chen@house.texas.gov',
        website: 'https://chen.assembly.tx.gov',
        address: '1100 Congress Avenue, Suite 300, Austin, TX 78701',
        termStart: '2021-01-12',
        termEnd: '2025-01-12',
        socialMedia: {
            twitter: '@AssemblymanChen',
            facebook: 'MichaelChenTX',
            instagram: '@michaelchen_tx'
        }
    },
    {
        id: '3',
        name: 'Jennifer Thompson',
        title: 'State Representative',
        party: 'Democrat',
        jurisdiction: 'State',
        district: 'District 22',
        state: 'New York',
        biography: 'Representative Thompson champions healthcare access and workers rights. Licensed attorney with extensive experience in labor law and community organizing.',
        email: 'jennifer.thompson@nyassembly.gov',
        website: 'https://thompson.assembly.ny.gov',
        address: 'LOB 531, Albany, NY 12248',
        termStart: '2019-01-01',
        termEnd: '2024-12-31',
        socialMedia: {
            twitter: '@RepThompsonNY',
            facebook: 'JenniferThompsonNY',
            linkedin: 'jennifer-thompson-ny'
        }
    },
    {
        id: '4',
        name: 'Robert Williams',
        title: 'State Senator',
        party: 'Republican',
        jurisdiction: 'State',
        district: 'District 8',
        state: 'Florida',
        biography: 'Senator Williams focuses on infrastructure development and economic growth. Former mayor with a track record of bipartisan collaboration on key initiatives.',
        email: 'robert.williams@flsenate.gov',
        website: 'https://williams.flsenate.gov',
        address: '404 South Monroe Street, Tallahassee, FL 32399',
        termStart: '2018-11-06',
        termEnd: '2026-11-03',
        socialMedia: {
            twitter: '@SenWilliamsFL',
            facebook: 'SenatorRobertWilliams',
            instagram: '@robwilliams_fl'
        }
    },
    {
        id: '5',
        name: 'Patricia Rodriguez',
        title: 'State Assembly Member',
        party: 'Democrat',
        jurisdiction: 'State',
        district: 'District 67',
        state: 'Arizona',
        biography: 'Assembly Member Rodriguez is a tireless advocate for immigration reform and affordable housing. Community organizer turned legislator serving her second term.',
        email: 'patricia.rodriguez@azleg.gov',
        website: 'https://rodriguez.azleg.gov',
        address: '1700 West Washington Street, Phoenix, AZ 85007',
        termStart: '2021-01-11',
        termEnd: '2025-01-13',
        socialMedia: {
            twitter: '@AsmRodriguezAZ',
            facebook: 'PatriciaRodriguezAZ',
            instagram: '@patriciarodriguez_az',
            linkedin: 'patricia-rodriguez-az'
        }
    },
    {
        id: '6',
        name: 'David Park',
        title: 'State Senator',
        party: 'Independent',
        jurisdiction: 'State',
        district: 'District 5',
        state: 'Maine',
        biography: 'Senator Park brings an independent voice to the legislature, focusing on rural development and sustainable agriculture. Third-generation farmer and environmental scientist.',
        email: 'david.park@legislature.maine.gov',
        website: 'https://park.mainelegislature.org',
        address: '3 State House Station, Augusta, ME 04333',
        termStart: '2020-12-02',
        termEnd: '2024-12-04',
        socialMedia: {
            twitter: '@SenParkME',
            facebook: 'DavidParkMaine'
        }
    },
    {
        id: '7',
        name: 'Amanda Foster',
        title: 'State Representative',
        party: 'Democrat',
        jurisdiction: 'State',
        district: 'District 14',
        state: 'Colorado',
        biography: 'Representative Foster leads efforts on renewable energy and climate action. Former tech executive bringing innovation to state government.',
        email: 'amanda.foster@state.co.us',
        website: 'https://foster.colorado.gov',
        address: '200 East Colfax Avenue, Denver, CO 80203',
        termStart: '2023-01-09',
        termEnd: '2025-01-08',
        socialMedia: {
            twitter: '@RepFosterCO',
            facebook: 'AmandaFosterCO',
            instagram: '@amandafoster_co',
            linkedin: 'amanda-foster-colorado'
        }
    },
    {
        id: '8',
        name: 'James Mitchell',
        title: 'State Senator',
        party: 'Republican',
        jurisdiction: 'State',
        district: 'District 31',
        state: 'Georgia',
        biography: 'Senator Mitchell prioritizes public safety and veterans affairs. Retired military officer with 20 years of service and strong community ties.',
        email: 'james.mitchell@senate.ga.gov',
        website: 'https://mitchell.senate.ga.gov',
        address: '421 State Capitol, Atlanta, GA 30334',
        termStart: '2019-01-14',
        termEnd: '2025-01-13',
        socialMedia: {
            twitter: '@SenMitchellGA',
            facebook: 'JamesMitchellGA',
            linkedin: 'james-mitchell-ga'
        }
    },
    {
        id: '9',
        name: 'Lisa Nguyen',
        title: 'State Assembly Member',
        party: 'Democrat',
        jurisdiction: 'State',
        district: 'District 88',
        state: 'Washington',
        biography: 'Assembly Member Nguyen champions tech policy and digital privacy rights. Software engineer turned public servant focused on modernizing government.',
        email: 'lisa.nguyen@leg.wa.gov',
        website: 'https://nguyen.leg.wa.gov',
        address: '415 15th Avenue SW, Olympia, WA 98504',
        termStart: '2022-01-10',
        termEnd: '2024-12-09',
        socialMedia: {
            twitter: '@AsmNguyenWA',
            facebook: 'LisaNguyenWA',
            instagram: '@lisanguyen_wa'
        }
    },
    {
        id: '10',
        name: 'Thomas Blackwell',
        title: 'State Representative',
        party: 'Republican',
        jurisdiction: 'State',
        district: 'District 19',
        state: 'Ohio',
        biography: 'Representative Blackwell focuses on manufacturing jobs and trade policy. Business owner with deep roots in Ohio\'s industrial sector.',
        email: 'thomas.blackwell@ohiohouse.gov',
        website: 'https://blackwell.ohiohouse.gov',
        address: '77 South High Street, Columbus, OH 43215',
        termStart: '2021-01-04',
        termEnd: '2025-01-06',
        socialMedia: {
            twitter: '@RepBlackwellOH',
            facebook: 'ThomasBlackwellOhio'
        }
    },

    // COUNTY LEVEL OFFICIALS (10)
    {
        id: '11',
        name: 'Rebecca Santos',
        title: 'County Commissioner',
        party: 'Democrat',
        jurisdiction: 'County',
        district: 'District 3',
        state: 'California',
        biography: 'Commissioner Santos oversees county infrastructure and public works. Former civil engineer dedicated to sustainable development and community planning.',
        email: 'rebecca.santos@county.ca.gov',
        website: 'https://santoscommissioner.org',
        address: '1500 Main Street, County Building, Los Angeles, CA 90012',
        termStart: '2020-01-07',
        termEnd: '2024-12-31',
        socialMedia: {
            twitter: '@CommissionerSantos',
            facebook: 'RebeccaSantosCommissioner',
            instagram: '@rebeccasantos_ca'
        }
    },
    {
        id: '12',
        name: 'Daniel O\'Brien',
        title: 'County Supervisor',
        party: 'Republican',
        jurisdiction: 'County',
        district: 'District 2',
        state: 'Texas',
        biography: 'Supervisor O\'Brien manages county budget and taxation policies. Certified public accountant with 15 years of experience in local government finance.',
        email: 'daniel.obrien@co.harris.tx.us',
        website: 'https://obriensupervisor.com',
        address: '1001 Preston Street, Houston, TX 77002',
        termStart: '2019-01-01',
        termEnd: '2027-12-31',
        socialMedia: {
            twitter: '@SupervisorOBrien',
            facebook: 'DanielOBrienTX'
        }
    },
    {
        id: '13',
        name: 'Maria Gonzalez',
        title: 'County Commissioner',
        party: 'Democrat',
        jurisdiction: 'County',
        district: 'District 4',
        state: 'Florida',
        biography: 'Commissioner Gonzalez advocates for healthcare access and senior services. Healthcare administrator with a passion for serving vulnerable populations.',
        email: 'maria.gonzalez@miamidade.gov',
        website: 'https://gonzalezcommissioner.org',
        address: '111 NW 1st Street, Miami, FL 33128',
        termStart: '2020-11-17',
        termEnd: '2024-11-19',
        socialMedia: {
            twitter: '@CommGonzalezFL',
            facebook: 'MariaGonzalezMiami',
            instagram: '@mariagonzalez_fl',
            linkedin: 'maria-gonzalez-miami'
        }
    },
    {
        id: '14',
        name: 'Christopher Lee',
        title: 'County Executive',
        party: 'Independent',
        jurisdiction: 'County',
        district: 'At-Large',
        state: 'Maryland',
        biography: 'County Executive Lee brings nonpartisan leadership to county government. Former business consultant focused on efficiency and transparency.',
        email: 'christopher.lee@montgomerycountymd.gov',
        website: 'https://lee.montgomerycountymd.gov',
        address: '101 Monroe Street, Rockville, MD 20850',
        termStart: '2022-12-06',
        termEnd: '2026-12-07',
        socialMedia: {
            twitter: '@CountyExecLee',
            facebook: 'ChristopherLeeMD',
            linkedin: 'christopher-lee-md'
        }
    },
    {
        id: '15',
        name: 'Angela White',
        title: 'County Commissioner',
        party: 'Democrat',
        jurisdiction: 'County',
        district: 'District 1',
        state: 'Georgia',
        biography: 'Commissioner White focuses on economic development and job creation. Small business owner committed to expanding opportunities for all residents.',
        email: 'angela.white@fultoncountyga.gov',
        website: 'https://whitecommissioner.org',
        address: '141 Pryor Street SW, Atlanta, GA 30303',
        termStart: '2021-01-05',
        termEnd: '2025-01-07',
        socialMedia: {
            twitter: '@CommWhiteGA',
            facebook: 'AngelaWhiteFulton',
            instagram: '@angelawhite_ga'
        }
    },
    {
        id: '16',
        name: 'Richard Hayes',
        title: 'County Supervisor',
        party: 'Republican',
        jurisdiction: 'County',
        district: 'District 5',
        state: 'Virginia',
        biography: 'Supervisor Hayes champions public safety and emergency preparedness. Former fire chief with 25 years of first responder experience.',
        email: 'richard.hayes@fairfaxcounty.gov',
        website: 'https://hayessupervisor.com',
        address: '12000 Government Center Parkway, Fairfax, VA 22035',
        termStart: '2020-01-01',
        termEnd: '2024-12-31',
        socialMedia: {
            twitter: '@SupervisorHayes',
            facebook: 'RichardHayesVA'
        }
    },
    {
        id: '17',
        name: 'Sandra Kim',
        title: 'County Commissioner',
        party: 'Democrat',
        jurisdiction: 'County',
        district: 'District 6',
        state: 'Washington',
        biography: 'Commissioner Kim leads initiatives on affordable housing and homelessness. Social worker turned policymaker with deep community connections.',
        email: 'sandra.kim@kingcounty.gov',
        website: 'https://kimcommissioner.org',
        address: '401 5th Avenue, Seattle, WA 98104',
        termStart: '2022-01-01',
        termEnd: '2026-12-31',
        socialMedia: {
            twitter: '@CommKimWA',
            facebook: 'SandraKimKingCounty',
            instagram: '@sandrakim_wa',
            linkedin: 'sandra-kim-wa'
        }
    },
    {
        id: '18',
        name: 'Marcus Johnson',
        title: 'County Clerk',
        party: 'Democrat',
        jurisdiction: 'County',
        district: 'At-Large',
        state: 'Illinois',
        biography: 'County Clerk Johnson ensures fair elections and transparent record-keeping. Technology expert modernizing county administrative systems.',
        email: 'marcus.johnson@cookcountyil.gov',
        website: 'https://johnsonclerk.org',
        address: '118 North Clark Street, Chicago, IL 60602',
        termStart: '2018-12-03',
        termEnd: '2026-12-07',
        socialMedia: {
            twitter: '@ClerkJohnsonIL',
            facebook: 'MarcusJohnsonCook'
        }
    },
    {
        id: '19',
        name: 'Katherine Anderson',
        title: 'County Treasurer',
        party: 'Republican',
        jurisdiction: 'County',
        district: 'At-Large',
        state: 'Arizona',
        biography: 'County Treasurer Anderson manages public funds with fiscal prudence. Financial advisor committed to protecting taxpayer dollars.',
        email: 'katherine.anderson@maricopa.gov',
        website: 'https://andersontreasurer.com',
        address: '301 West Jefferson Street, Phoenix, AZ 85003',
        termStart: '2021-01-04',
        termEnd: '2025-01-06',
        socialMedia: {
            twitter: '@TreasurerAnderson',
            facebook: 'KatherineAndersonAZ'
        }
    },
    {
        id: '20',
        name: 'Victor Reyes',
        title: 'County Commissioner',
        party: 'Democrat',
        jurisdiction: 'County',
        district: 'District 7',
        state: 'Texas',
        biography: 'Commissioner Reyes advocates for environmental protection and parks development. Environmental scientist dedicated to preserving natural resources.',
        email: 'victor.reyes@traviscountytx.gov',
        website: 'https://reyescommissioner.org',
        address: '700 Lavaca Street, Austin, TX 78767',
        termStart: '2023-01-01',
        termEnd: '2027-12-31',
        socialMedia: {
            twitter: '@CommReyesTX',
            facebook: 'VictorReyesTravis',
            instagram: '@victorreyes_tx',
            linkedin: 'victor-reyes-travis'
        }
    },

    // CITY LEVEL OFFICIALS (10)
    {
        id: '21',
        name: 'Elizabeth Chen',
        title: 'City Council Member',
        party: 'Democrat',
        jurisdiction: 'City',
        district: 'District 4',
        state: 'California',
        biography: 'Council Member Chen focuses on public transportation and urban planning. Urban planner with expertise in sustainable city development.',
        email: 'elizabeth.chen@sfgov.org',
        website: 'https://chencitycouncil.org',
        address: '1 Dr Carlton B Goodlett Place, San Francisco, CA 94102',
        termStart: '2021-01-08',
        termEnd: '2025-01-10',
        socialMedia: {
            twitter: '@CouncilChenSF',
            facebook: 'ElizabethChenSF',
            instagram: '@elizabethchen_sf'
        }
    },
    {
        id: '22',
        name: 'Robert Jackson',
        title: 'City Council Member',
        party: 'Independent',
        jurisdiction: 'City',
        district: 'District 8',
        state: 'New York',
        biography: 'Council Member Jackson brings independent perspective to local issues. Community activist and nonprofit director serving his first term.',
        email: 'robert.jackson@council.nyc.gov',
        website: 'https://jacksoncouncil.nyc',
        address: '250 Broadway, New York, NY 10007',
        termStart: '2022-01-01',
        termEnd: '2025-12-31',
        socialMedia: {
            twitter: '@CMJacksonNYC',
            facebook: 'RobertJacksonNYC',
            linkedin: 'robert-jackson-nyc'
        }
    },
    {
        id: '23',
        name: 'Michelle Davis',
        title: 'City Council Member',
        party: 'Democrat',
        jurisdiction: 'City',
        district: 'District 2',
        state: 'Texas',
        biography: 'Council Member Davis champions arts and cultural programs. Former museum director bringing creativity to city government.',
        email: 'michelle.davis@austintexas.gov',
        website: 'https://daviscouncil.org',
        address: '301 West 2nd Street, Austin, TX 78701',
        termStart: '2020-01-06',
        termEnd: '2024-12-31',
        socialMedia: {
            twitter: '@CMDavisATX',
            facebook: 'MichelleDavisAustin',
            instagram: '@michelledavis_atx'
        }
    },
    {
        id: '24',
        name: 'Kevin Martinez',
        title: 'Mayor',
        party: 'Democrat',
        jurisdiction: 'City',
        district: 'At-Large',
        state: 'Colorado',
        biography: 'Mayor Martinez leads Denver with focus on homelessness solutions and economic equity. Former state legislator with proven leadership record.',
        email: 'kevin.martinez@denvergov.org',
        website: 'https://mayorkevinmartinez.com',
        address: '1437 Bannock Street, Denver, CO 80202',
        termStart: '2023-07-17',
        termEnd: '2027-07-19',
        socialMedia: {
            twitter: '@MayorMartinezDEN',
            facebook: 'MayorKevinMartinez',
            instagram: '@kevinmartinez_den',
            linkedin: 'kevin-martinez-denver'
        }
    },
    {
        id: '25',
        name: 'Jennifer Brooks',
        title: 'City Council Member',
        party: 'Republican',
        jurisdiction: 'City',
        district: 'District 6',
        state: 'Arizona',
        biography: 'Council Member Brooks focuses on neighborhood safety and code enforcement. Neighborhood association leader committed to quality of life issues.',
        email: 'jennifer.brooks@phoenix.gov',
        website: 'https://brookscouncil.org',
        address: '200 West Washington Street, Phoenix, AZ 85003',
        termStart: '2022-01-03',
        termEnd: '2026-01-05',
        socialMedia: {
            twitter: '@CMBrooksPHX',
            facebook: 'JenniferBrooksPhoenix'
        }
    },
    {
        id: '26',
        name: 'Anthony Wilson',
        title: 'City Council Member',
        party: 'Democrat',
        jurisdiction: 'City',
        district: 'District 3',
        state: 'Georgia',
        biography: 'Council Member Wilson advocates for economic development and job training programs. Labor organizer turned elected official.',
        email: 'anthony.wilson@atlantaga.gov',
        website: 'https://wilsoncouncil.org',
        address: '55 Trinity Avenue SW, Atlanta, GA 30303',
        termStart: '2018-01-02',
        termEnd: '2026-01-06',
        socialMedia: {
            twitter: '@CMWilsonATL',
            facebook: 'AnthonyWilsonAtlanta',
            instagram: '@anthonywilson_atl'
        }
    },
    {
        id: '27',
        name: 'Diana Patel',
        title: 'City Council Member',
        party: 'Democrat',
        jurisdiction: 'City',
        district: 'District 5',
        state: 'Washington',
        biography: 'Council Member Patel leads efforts on small business support and commercial district revitalization. Restaurant owner and entrepreneur.',
        email: 'diana.patel@seattle.gov',
        website: 'https://patelcouncil.org',
        address: '600 4th Avenue, Seattle, WA 98104',
        termStart: '2020-01-01',
        termEnd: '2024-12-31',
        socialMedia: {
            twitter: '@CMPatelSEA',
            facebook: 'DianaPatelSeattle',
            instagram: '@dianapatel_sea',
            linkedin: 'diana-patel-seattle'
        }
    },
    {
        id: '28',
        name: 'Stephen Harris',
        title: 'City Auditor',
        party: 'Independent',
        jurisdiction: 'City',
        district: 'At-Large',
        state: 'Oregon',
        biography: 'City Auditor Harris ensures accountability and transparency in city spending. Forensic accountant with dedication to good governance.',
        email: 'stephen.harris@portlandoregon.gov',
        website: 'https://harrisauditor.org',
        address: '1221 SW 4th Avenue, Portland, OR 97204',
        termStart: '2021-01-01',
        termEnd: '2025-12-31',
        socialMedia: {
            twitter: '@AuditorHarrisPDX',
            facebook: 'StephenHarrisPortland'
        }
    },
    {
        id: '29',
        name: 'Sophia Rodriguez',
        title: 'City Council Member',
        party: 'Democrat',
        jurisdiction: 'City',
        district: 'District 9',
        state: 'Florida',
        biography: 'Council Member Rodriguez champions climate resilience and coastal protection. Marine biologist addressing environmental challenges.',
        email: 'sophia.rodriguez@miamigov.com',
        website: 'https://rodriguezcouncil.org',
        address: '3500 Pan American Drive, Miami, FL 33133',
        termStart: '2021-11-18',
        termEnd: '2025-11-20',
        socialMedia: {
            twitter: '@CMRodriguezMIA',
            facebook: 'SophiaRodriguezMiami',
            instagram: '@sophiarodriguez_mia'
        }
    },
    {
        id: '30',
        name: 'William Taylor',
        title: 'City Council Member',
        party: 'Republican',
        jurisdiction: 'City',
        district: 'District 7',
        state: 'North Carolina',
        biography: 'Council Member Taylor focuses on infrastructure maintenance and fiscal conservatism. Engineer with practical approach to city challenges.',
        email: 'william.taylor@charlottenc.gov',
        website: 'https://taylorcouncil.org',
        address: '600 East 4th Street, Charlotte, NC 28202',
        termStart: '2019-12-02',
        termEnd: '2025-12-07',
        socialMedia: {
            twitter: '@CMTaylorCLT',
            facebook: 'WilliamTaylorCharlotte'
        }
    },

    // SCHOOL DISTRICT OFFICIALS (10)
    {
        id: '31',
        name: 'Patricia Morrison',
        title: 'School Board President',
        party: 'Democrat',
        jurisdiction: 'School District',
        district: 'Unified School District',
        state: 'California',
        biography: 'Board President Morrison leads efforts to improve student outcomes and teacher retention. Retired principal with 30 years in education.',
        email: 'patricia.morrison@lausd.net',
        website: 'https://morrisonschoolboard.org',
        address: '333 South Beaudry Avenue, Los Angeles, CA 90017',
        termStart: '2020-07-01',
        termEnd: '2024-06-30',
        socialMedia: {
            twitter: '@BoardPresidentPM',
            facebook: 'PatriciaMorrisonLAUSD'
        }
    },
    {
        id: '32',
        name: 'James Cooper',
        title: 'School Board Member',
        party: 'Republican',
        jurisdiction: 'School District',
        district: 'Independent School District',
        state: 'Texas',
        biography: 'Board Member Cooper advocates for STEM education and career readiness programs. Technology executive passionate about education innovation.',
        email: 'james.cooper@austinisd.org',
        website: 'https://cooperschoolboard.org',
        address: '1111 West 6th Street, Austin, TX 78703',
        termStart: '2021-05-20',
        termEnd: '2025-05-22',
        socialMedia: {
            twitter: '@BoardCooperAISD',
            facebook: 'JamesCooperAustin',
            linkedin: 'james-cooper-aisd'
        }
    },
    {
        id: '33',
        name: 'Maria Hernandez',
        title: 'School Board Member',
        party: 'Democrat',
        jurisdiction: 'School District',
        district: 'Public Schools',
        state: 'Florida',
        biography: 'Board Member Hernandez focuses on equity and multilingual education. Parent activist fighting for resources for underserved communities.',
        email: 'maria.hernandez@dadeschools.net',
        website: 'https://hernandezschoolboard.org',
        address: '1450 NE 2nd Avenue, Miami, FL 33132',
        termStart: '2022-11-22',
        termEnd: '2026-11-24',
        socialMedia: {
            twitter: '@BoardHernandezMD',
            facebook: 'MariaHernandezMDCPS',
            instagram: '@mariahernandez_mdcps'
        }
    },
    {
        id: '34',
        name: 'David Young',
        title: 'School Board Trustee',
        party: 'Independent',
        jurisdiction: 'School District',
        district: 'School District',
        state: 'Illinois',
        biography: 'Trustee Young brings business perspective to education governance. CPA focused on financial sustainability and accountability.',
        email: 'david.young@cps.edu',
        website: 'https://youngschoolboard.org',
        address: '42 West Madison Street, Chicago, IL 60602',
        termStart: '2019-07-01',
        termEnd: '2027-06-30',
        socialMedia: {
            twitter: '@TrusteeYoungCPS',
            facebook: 'DavidYoungCPS'
        }
    },
    {
        id: '35',
        name: 'Linda Washington',
        title: 'School Board Member',
        party: 'Democrat',
        jurisdiction: 'School District',
        district: 'Public Schools',
        state: 'Georgia',
        biography: 'Board Member Washington champions special education services and inclusive classrooms. Special education advocate and parent leader.',
        email: 'linda.washington@atlanta.k12.ga.us',
        website: 'https://washingtonschoolboard.org',
        address: '130 Trinity Avenue SW, Atlanta, GA 30303',
        termStart: '2021-01-11',
        termEnd: '2025-01-13',
        socialMedia: {
            twitter: '@BoardWashingtonAPS',
            facebook: 'LindaWashingtonAPS',
            instagram: '@lindawashington_aps'
        }
    },
    {
        id: '36',
        name: 'Robert Kim',
        title: 'School Board Vice President',
        party: 'Republican',
        jurisdiction: 'School District',
        district: 'School District',
        state: 'Arizona',
        biography: 'Board Vice President Kim prioritizes academic excellence and school choice. Education policy researcher and parent of three.',
        email: 'robert.kim@phoenixschools.org',
        website: 'https://kimschoolboard.org',
        address: '1817 North 7th Street, Phoenix, AZ 85006',
        termStart: '2020-01-01',
        termEnd: '2024-12-31',
        socialMedia: {
            twitter: '@BoardVPKim',
            facebook: 'RobertKimPhoenix'
        }
    },
    {
        id: '37',
        name: 'Sandra Lewis',
        title: 'School Board Member',
        party: 'Democrat',
        jurisdiction: 'School District',
        district: 'Public Schools',
        state: 'Washington',
        biography: 'Board Member Lewis advocates for mental health services and student wellness programs. Child psychologist dedicated to holistic student support.',
        email: 'sandra.lewis@seattleschools.org',
        website: 'https://lewisschoolboard.org',
        address: '2445 3rd Avenue South, Seattle, WA 98134',
        termStart: '2019-12-04',
        termEnd: '2027-12-07',
        socialMedia: {
            twitter: '@BoardLewisSPS',
            facebook: 'SandraLewisSeattle',
            linkedin: 'sandra-lewis-sps'
        }
    },
    {
        id: '38',
        name: 'Michael Garcia',
        title: 'School Board Clerk',
        party: 'Democrat',
        jurisdiction: 'School District',
        district: 'Unified School District',
        state: 'California',
        biography: 'Board Clerk Garcia ensures transparency and community engagement. Former teacher committed to parent and community involvement.',
        email: 'michael.garcia@sdusd.edu',
        website: 'https://garciaschoolboard.org',
        address: '4100 Normal Street, San Diego, CA 92103',
        termStart: '2022-12-05',
        termEnd: '2026-12-07',
        socialMedia: {
            twitter: '@BoardClerkGarcia',
            facebook: 'MichaelGarciaSDUSD',
            instagram: '@michaelgarcia_sdusd'
        }
    },
    {
        id: '39',
        name: 'Karen Anderson',
        title: 'School Board Member',
        party: 'Republican',
        jurisdiction: 'School District',
        district: 'County Public Schools',
        state: 'Virginia',
        biography: 'Board Member Anderson focuses on curriculum standards and academic accountability. Education researcher and curriculum specialist.',
        email: 'karen.anderson@fcps.edu',
        website: 'https://andersonschoolboard.org',
        address: '8115 Gatehouse Road, Falls Church, VA 22042',
        termStart: '2020-01-01',
        termEnd: '2024-12-31',
        socialMedia: {
            twitter: '@BoardAndersonFCPS',
            facebook: 'KarenAndersonFCPS'
        }
    },
    {
        id: '40',
        name: 'Charles Thompson',
        title: 'School Board Member',
        party: 'Independent',
        jurisdiction: 'School District',
        district: 'Public Schools',
        state: 'Colorado',
        biography: 'Board Member Thompson brings independent voice to education policy. Community organizer focused on parent empowerment and local control.',
        email: 'charles.thompson@dpsk12.org',
        website: 'https://thompsonschoolboard.org',
        address: '1860 Lincoln Street, Denver, CO 80203',
        termStart: '2021-11-16',
        termEnd: '2025-11-18',
        socialMedia: {
            twitter: '@BoardThompsonDPS',
            facebook: 'CharlesThompsonDPS',
            linkedin: 'charles-thompson-dps'
        }
    },
];

function getPartyColor(party: string) {
    switch (party) {
        case 'Democrat':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Republican':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'Independent':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

function RepresentativeCard({ rep }: { rep: Representative }) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow border">
            <CardContent className="p-6">
                <div className="space-y-3">
                    {/* Name */}
                    <h3 className="font-semibold text-lg">{rep.name}</h3>

                    {/* Title, District */}
                    <p className="text-sm text-muted-foreground">
                        {rep.title}
                        {rep.district && `, ${rep.district}`}
                    </p>

                    {/* Party Badge */}
                    <div className="flex gap-2">
                        <Badge variant="outline" className={`${getPartyColor(rep.party)} text-xs`}>
                            {rep.party}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {rep.jurisdiction}
                        </Badge>
                    </div>

                    {/* Term Dates */}
                    {rep.termStart && rep.termEnd && (
                        <p className="text-xs text-muted-foreground">
                            Term: {new Date(rep.termStart).getFullYear()} - {new Date(rep.termEnd).getFullYear()}
                        </p>
                    )}

                    {/* Biography */}
                    {rep.biography && (
                        <p className="text-sm leading-relaxed text-muted-foreground">{rep.biography}</p>
                    )}

                    {/* Send Message Button */}
                    <div className="pt-3 border-t">
                        <Button asChild className="w-full" size="sm">
                            <Link href={`/advocacy-message?recipientName=${encodeURIComponent(rep.name)}&recipientTitle=${encodeURIComponent(rep.title)}&recipientEmail=${encodeURIComponent(rep.email || '')}&recipientState=${encodeURIComponent(rep.state || '')}&recipientDistrict=${encodeURIComponent(rep.district || '')}&recipientJurisdiction=${encodeURIComponent(rep.jurisdiction)}`}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send message
                            </Link>
                        </Button>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-2 pt-2">
                        {/* Website */}
                        {rep.website && (
                            <div className="flex items-start gap-2 text-sm">
                                <span className="text-muted-foreground">🌐</span>
                                <a href={rep.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                    Official Website
                                </a>
                            </div>
                        )}

                        {/* Address */}
                        {rep.address && (
                            <div className="flex items-start gap-2 text-sm">
                                <span className="text-muted-foreground">📍</span>
                                <p className="text-muted-foreground">{rep.address}</p>
                            </div>
                        )}
                    </div>

                    {/* Social Media Links */}
                    {rep.socialMedia && (
                        <div className="flex gap-3 pt-2">
                            {rep.socialMedia.twitter && (
                                <a href={`https://twitter.com/${rep.socialMedia.twitter.replace('@', '')}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-blue-400 hover:text-blue-600 text-sm">
                                    Twitter
                                </a>
                            )}
                            {rep.socialMedia.facebook && (
                                <a href={`https://facebook.com/${rep.socialMedia.facebook}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-blue-600 hover:text-blue-800 text-sm">
                                    Facebook
                                </a>
                            )}
                            {rep.socialMedia.instagram && (
                                <a href={`https://instagram.com/${rep.socialMedia.instagram.replace('@', '')}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-pink-600 hover:text-pink-800 text-sm">
                                    Instagram
                                </a>
                            )}
                            {rep.socialMedia.linkedin && (
                                <a href={`https://linkedin.com/in/${rep.socialMedia.linkedin}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-blue-700 hover:text-blue-900 text-sm">
                                    LinkedIn
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function ElectedOfficialsPage() {
    const jurisdictions = ['State', 'County', 'City', 'School District'] as const;
    const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(jurisdictions.slice());

    const selectJurisdiction = (jurisdiction: string) => {
        setSelectedJurisdictions([jurisdiction]);
    };

    const showAll = () => {
        setSelectedJurisdictions(jurisdictions.slice());
    };

    // Group officials by jurisdiction
    const groupedOfficials = {
        'State': representatives.filter(r => r.jurisdiction === 'State'),
        'County': representatives.filter(r => r.jurisdiction === 'County'),
        'City': representatives.filter(r => r.jurisdiction === 'City'),
        'School District': representatives.filter(r => r.jurisdiction === 'School District'),
    };

    // Filter based on selected jurisdictions
    const filteredGroupedOfficials = Object.fromEntries(
        Object.entries(groupedOfficials).filter(([jurisdiction]) =>
            selectedJurisdictions.includes(jurisdiction)
        )
    );

    return (
        <div className="bg-background flex-1">
            <div className="container mx-auto px-4 py-6 md:py-12 max-w-7xl">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        Elected Officials
                    </h1>
                    <p className="text-muted-foreground">
                        Browse elected officials at state, county, city, and school district levels
                    </p>
                </header>

                {/* Jurisdiction Filters */}
                <div className="mb-8">
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground">Filter by jurisdiction:</h3>
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={selectedJurisdictions.length === jurisdictions.length ? "default" : "outline"}
                            className={`cursor-pointer transition-all hover:scale-105 ${
                                selectedJurisdictions.length === jurisdictions.length
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                            }`}
                            onClick={showAll}
                        >
                            All (40)
                        </Badge>
                        {jurisdictions.map((jurisdiction) => {
                            const isSelected = selectedJurisdictions.length === 1 && selectedJurisdictions.includes(jurisdiction);
                            return (
                                <Badge
                                    key={jurisdiction}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`cursor-pointer transition-all hover:scale-105 ${
                                        isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted'
                                    }`}
                                    onClick={() => selectJurisdiction(jurisdiction)}
                                >
                                    {jurisdiction} ({groupedOfficials[jurisdiction as keyof typeof groupedOfficials].length})
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                {/* Officials by Jurisdiction */}
                <div className="space-y-12">
                    {Object.entries(filteredGroupedOfficials).map(([jurisdiction, officials]) => (
                        <section key={jurisdiction}>
                            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">
                                {jurisdiction} Officials ({officials.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {officials.map((rep) => (
                                    <RepresentativeCard key={rep.id} rep={rep} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
