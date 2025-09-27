// Simple test to verify our fixes
import { plans } from './server/plans';

console.log('=== Verifying Plans Import ===');
console.log('Plans object:', plans);
console.log('Plan keys:', Object.keys(plans));

if (plans && Object.keys(plans).length > 0) {
  console.log('✅ Plans imported successfully');
} else {
  console.log('❌ Plans import failed');
}

// Test the structure
Object.entries(plans).forEach(([key, plan]) => {
  console.log(`Plan ${key}:`, plan);
});

export {};