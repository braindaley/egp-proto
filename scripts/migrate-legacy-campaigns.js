#!/usr/bin/env node

/**
 * Migration script to convert legacy campaigns from advocacy-groups.ts to Firebase
 * These will be created as template campaigns that can be shown on the homepage
 * and managed in the dashboard.
 * 
 * Usage: node scripts/migrate-legacy-campaigns.js
 */

async function migrateCampaigns() {
  console.log('Starting migration of legacy campaigns...\n');
  
  try {
    // First, preview what will be migrated
    console.log('Fetching preview of campaigns to migrate...');
    const previewResponse = await fetch('http://localhost:3000/api/migrate-campaigns?preview=true');
    
    if (!previewResponse.ok) {
      throw new Error(`Preview failed: ${previewResponse.statusText}`);
    }
    
    const preview = await previewResponse.json();
    console.log(`Found ${preview.totalCampaigns} campaigns to migrate\n`);
    
    // Show summary by group
    const groupSummary = {};
    preview.campaigns.forEach(campaign => {
      if (!groupSummary[campaign.groupName]) {
        groupSummary[campaign.groupName] = 0;
      }
      groupSummary[campaign.groupName]++;
    });
    
    console.log('Campaigns by group:');
    Object.entries(groupSummary).forEach(([group, count]) => {
      console.log(`  - ${group}: ${count} campaigns`);
    });
    
    console.log('\nProceed with migration? (y/n)');
    
    // For automated script, we'll proceed automatically
    // In a real scenario, you'd wait for user input
    
    // Perform the migration
    console.log('\nMigrating campaigns as templates...');
    const migrationResponse = await fetch('http://localhost:3000/api/migrate-campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        migrateAllAsTemplates: true
      })
    });
    
    if (!migrationResponse.ok) {
      const error = await migrationResponse.json();
      throw new Error(`Migration failed: ${error.error || migrationResponse.statusText}`);
    }
    
    const result = await migrationResponse.json();
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`   Migrated: ${result.migratedCount} campaigns`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Some errors occurred:');
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log('\n📝 Next steps:');
    console.log('   1. Check the dashboard at http://localhost:3000/dashboard/campaigns');
    console.log('   2. Template campaigns are now available for all groups');
    console.log('   3. Homepage will show these campaigns in the feed');
    console.log('   4. Users can manage these campaigns from the dashboard');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if the server is running
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('Legacy Campaigns Migration Tool\n');
  console.log('================================\n');
  
  // Check if server is running
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.error('❌ Server is not running. Please start the development server first:');
    console.error('   npm run dev\n');
    process.exit(1);
  }
  
  await migrateCampaigns();
})();