// TestRails MCP Integration Script for TFX-18 Test Cases
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client = axios.create({
    baseURL: `${process.env.TESTRAILS_URL}/index.php?/api/v2`,
    auth: {
        username: process.env.TESTRAILS_USERNAME,
        password: process.env.TESTRAILS_API_KEY,
    },
    headers: {
        'Content-Type': 'application/json',
    },
});

async function createTestCasesForTFX18() {
    try {
        console.log('🔍 Getting projects...');
        const projectsResponse = await client.get('/get_projects');
        const projects = projectsResponse.data.projects || projectsResponse.data;
        
        const highwayProject = projects.find(p => p.name.toLowerCase().includes('highway'));
        console.log('Highway.com project:', highwayProject);
        
        if (!highwayProject) {
            throw new Error('Highway.com project not found');
        }
        
        console.log('\n🔍 Getting suites for Highway.com project...');
        const suitesResponse = await client.get(`/get_suites/${highwayProject.id}`);
        const suites = suitesResponse.data.suites || suitesResponse.data;
        console.log('Suites found:', suites);
        
        let targetSuite = suites[0]; // Use first suite for now
        if (!targetSuite) {
            throw new Error('No suites found in Highway.com project');
        }
        
        console.log('\n🔍 Getting sections for suite:', targetSuite.name);
        const sectionsResponse = await client.get(`/get_sections/${highwayProject.id}&suite_id=${targetSuite.id}`);
        const sections = sectionsResponse.data.sections || sectionsResponse.data;
        console.log('Sections found:', sections);
        
        // Look for "discover loads" section or create it
        let discoverLoadsSection = sections.find(section => 
            section.name.toLowerCase().includes('discover loads') || 
            section.name.toLowerCase().includes('discover_loads')
        );
        
        if (!discoverLoadsSection) {
            console.log('\n📁 Creating "Discover Loads" section...');
            const createSectionResponse = await client.post(`/add_section/${highwayProject.id}`, {
                name: 'Discover Loads',
                description: 'Test cases for the Discover Loads epic functionality',
                suite_id: targetSuite.id
            });
            discoverLoadsSection = createSectionResponse.data;
            console.log('Created section:', discoverLoadsSection);
        }
        
        console.log('\n📋 Creating test cases for TFX-18...');
        
        // Test cases based on TFX-18 requirements
        const testCases = [
            {
                title: 'TFX-18 - Calendar Picker Navigation from Date Fields',
                description: `**Objective:** Verify navigation to calendar picker from pick-up and drop-off date fields

**Test Steps:**
1. Open the search screen
2. Tap on the pick-up date field
3. Verify redirection to calendar picker screen with title "Select Pick-Up Date Range"
4. Navigate back and tap on drop-off date field
5. Verify redirection to calendar picker screen with title "Select Drop-Off Date Range"

**Expected Result:** User is redirected to dedicated calendar picker screen with appropriate title based on field selected

**References:** TFX-18`,
                priority: 3, // High priority
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Date Range Summary Display',
                description: `**Objective:** Verify date range summary displays correctly at top of screen

**Test Steps:**
1. Open calendar picker
2. Select a start date
3. Verify summary shows "{start_date} → End date"
4. Select an end date
5. Verify summary shows complete range (e.g., "Tue 8/5 → Sat 8/9")
6. Clear selection and verify summary returns to default state

**Expected Result:** Summary correctly displays selected date range and updates in real-time

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Reset Button Functionality',
                description: `**Objective:** Verify Reset CTA clears all selected dates

**Test Steps:**
1. Open calendar picker
2. Select start and end dates
3. Tap on Reset CTA at top right corner
4. Verify all dates are cleared
5. Verify summary returns to default state
6. Select new dates to ensure functionality works after reset

**Expected Result:** Reset button clears all selections and calendar returns to initial state

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - First Date Click Sets Start Date',
                description: `**Objective:** Verify first click on calendar sets start date with no default selection

**Test Steps:**
1. Open calendar picker with no default selection
2. Verify no dates are pre-selected
3. Click on any available future date
4. Verify that date is marked as start date
5. Verify summary shows "{selected_date} → End date"

**Expected Result:** First clicked date becomes the start date with appropriate visual feedback

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - End Date Selection Rules',
                description: `**Objective:** Verify end date must be equal to or after start date

**Test Steps:**
1. Select a start date
2. Try to select an end date before the start date
3. Verify the earlier date becomes new start date instead
4. Select an end date equal to start date
5. Verify selection is successful
6. Select an end date after start date
7. Verify range selection is successful

**Expected Result:** End date validation prevents invalid ranges and resets appropriately

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Third Click Resets Selection',
                description: `**Objective:** Verify third click on different date resets to new start date

**Test Steps:**
1. Select a start date
2. Select an end date
3. Click on a different date (third click)
4. Verify previous selection is cleared
5. Verify that date becomes the new start date
6. Verify summary shows "{new_date} → End date"

**Expected Result:** Third click resets selection and sets new start date

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Past Dates Not Selectable',
                description: `**Objective:** Verify past dates cannot be selected - current day is first available

**Test Steps:**
1. Open calendar picker
2. Try to select dates before today
3. Verify past dates are disabled/not selectable
4. Verify current day is the first available date
5. Select current day and verify it works
6. Navigate to previous months and verify past dates are disabled

**Expected Result:** Past dates are not selectable, current day is first available date

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - No Maximum Future Date Limit',
                description: `**Objective:** Verify no maximum date limit in future

**Test Steps:**
1. Open calendar picker
2. Navigate to future months/years
3. Verify dates can be selected without limit
4. Select dates several months in the future
5. Verify selection works properly
6. Test scrolling to very distant future dates

**Expected Result:** No maximum date restriction in the future, all future dates selectable

**References:** TFX-18`,
                priority: 2,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Single Date Selection',
                description: `**Objective:** Verify single date selection by selecting only start date

**Test Steps:**
1. Open calendar picker
2. Select only a start date
3. Tap Done without selecting end date
4. Verify single date is applied to search field
5. Test selecting same date as start and end
6. Verify it displays as single date on search screen

**Expected Result:** Single date selection works with only start date or same start/end date

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Double Click Same Date Clears Selection',
                description: `**Objective:** Verify clicking twice on same date clears selection

**Test Steps:**
1. Select a date
2. Click the same date again
3. Verify the date is cleared from selection
4. Test with start date in a range
5. Test with end date in a range
6. Verify appropriate clearing behavior

**Expected Result:** Double clicking same date clears that date from selection

**References:** TFX-18`,
                priority: 2,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Done Button Always Enabled',
                description: `**Objective:** Verify Done button is always enabled regardless of selection state

**Test Steps:**
1. Open calendar picker with no selection
2. Verify Done button is enabled
3. Select dates and verify Done button remains enabled
4. Clear selection and verify Done button still enabled
5. Test Done button with various selection states
6. Verify navigation works in all cases

**Expected Result:** Done button is always enabled and functional regardless of selection state

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Data Persistence in State Layer',
                description: `**Objective:** Verify selected dates are persisted for API call to /monitor/api/v1/loads/carrier_search

**Test Steps:**
1. Select date range in calendar picker
2. Tap Done to return to search page
3. Verify selected dates are maintained in application state
4. Trigger search and verify API call includes correct date parameters
5. Return to calendar picker and verify dates are still selected
6. Modify dates and verify state updates correctly

**Expected Result:** Selected dates are properly persisted and formatted for API calls

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Same Day Start/End Date Handling',
                description: `**Objective:** Verify same day selection for start and end dates displays as single date

**Test Steps:**
1. Select a start date
2. Select the same date as end date
3. Tap Done and return to search page
4. Verify only one day is filled in the search page
5. Test with different same-day selections
6. Verify API receives single date parameter

**Expected Result:** When start and end dates are the same, only one day appears on search page

**References:** TFX-18`,
                priority: 3,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Smooth Navigation Between Screens',
                description: `**Objective:** Verify smooth navigation between search screen and calendar picker

**Test Steps:**
1. Navigate from search screen to calendar picker
2. Make selections and return to search screen
3. Verify transitions are smooth and responsive
4. Test back navigation functionality
5. Test device back button behavior
6. Verify no data loss during navigation

**Expected Result:** Navigation between screens is smooth, intuitive, and preserves data appropriately

**References:** TFX-18`,
                priority: 2,
                refs: 'TFX-18'
            },
            {
                title: 'TFX-18 - Edge Cases and Error Handling',
                description: `**Objective:** Verify graceful handling of edge cases and invalid selections

**Test Steps:**
1. Test rapid date selection and deselection
2. Test calendar during date transitions (midnight)
3. Test with device date/time changes
4. Test memory pressure scenarios
5. Test network connectivity issues during state persistence
6. Test app backgrounding/foregrounding with calendar open

**Expected Result:** All edge cases are handled gracefully with appropriate user feedback

**References:** TFX-18`,
                priority: 2,
                refs: 'TFX-18'
            }
        ];
        
        // Create each test case
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n📝 Creating test case ${i + 1}/${testCases.length}: ${testCase.title}`);
            
            try {
                const response = await client.post(`/add_case/${discoverLoadsSection.id}`, {
                    title: testCase.title,
                    template_id: 1, // Test Case (Text)
                    type_id: 1, // Acceptance
                    priority_id: testCase.priority,
                    custom_preconds: 'User has access to the mobile app and is on the search screen',
                    custom_steps: testCase.description,
                    refs: testCase.refs
                });
                
                console.log(`✅ Created test case: ${response.data.title} (ID: ${response.data.id})`);
            } catch (error) {
                console.error(`❌ Failed to create test case: ${testCase.title}`);
                console.error('Error:', error.response?.data || error.message);
            }
        }
        
        console.log('\n🎉 Test case creation completed!');
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

// Run the script
createTestCasesForTFX18();
