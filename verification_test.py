#!/usr/bin/env python3
"""
Quick verification test for Madinah Ziyarat booking backend API endpoints
Testing the specific sample booking payload provided in the review request
"""

import requests
import json
import sys
from datetime import datetime

class BookingVerificationTester:
    def __init__(self):
        # Use the REACT_APP_BACKEND_URL from frontend/.env
        self.base_url = "https://madina-tours.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.headers = {'Content-Type': 'application/json'}
        
    def test_api_health(self):
        """Test if the API is running and accessible"""
        print("🔍 Testing API Health...")
        try:
            response = requests.get(f"{self.api_url}/health", headers=self.headers, timeout=10)
            if response.status_code == 200:
                print("✅ API Health Check: PASSED")
                print(f"   Response: {response.json()}")
                return True
            else:
                print(f"❌ API Health Check: FAILED - Status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API Health Check: FAILED - {str(e)}")
            return False
    
    def test_booking_endpoint_with_sample_data(self):
        """Test POST /api/bookings with the exact sample data from review request"""
        print("\n🔍 Testing POST /api/bookings with sample data...")
        
        # Exact sample payload from the review request
        sample_booking = {
            "name": "John Doe",
            "email": "john@example.com", 
            "phone": "+1234567890",
            "site_id": 1,
            "site_name": "Masjid Quba",
            "group_size": 2,
            "date": "2024-09-30",
            "time": "10:00",
            "special_requests": "None",
            "total_price": 54,
            "booking_type": "contact"
        }
        
        print(f"   URL: {self.api_url}/bookings")
        print(f"   Payload: {json.dumps(sample_booking, indent=2)}")
        
        try:
            response = requests.post(
                f"{self.api_url}/bookings", 
                json=sample_booking, 
                headers=self.headers,
                timeout=15
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                print("✅ Booking Creation: PASSED")
                print(f"   Response Data: {json.dumps(response_data, indent=2)}")
                
                # Validate response structure
                required_fields = ['id', 'name', 'email', 'phone', 'site_id', 'site_name', 
                                 'group_size', 'date', 'time', 'total_price', 'booking_type', 'status']
                
                missing_fields = [field for field in required_fields if field not in response_data]
                if missing_fields:
                    print(f"⚠️  Missing fields in response: {missing_fields}")
                else:
                    print("✅ Response structure validation: PASSED")
                
                # Validate data integrity
                if (response_data.get('name') == sample_booking['name'] and
                    response_data.get('email') == sample_booking['email'] and
                    response_data.get('total_price') == sample_booking['total_price']):
                    print("✅ Data integrity validation: PASSED")
                else:
                    print("❌ Data integrity validation: FAILED")
                
                return True, response_data.get('id')
            else:
                print(f"❌ Booking Creation: FAILED - Status {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error Response: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error Text: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Booking Creation: FAILED - {str(e)}")
            return False, None
    
    def test_booking_retrieval(self, booking_id):
        """Test GET /api/bookings/{booking_id} to verify data storage"""
        if not booking_id:
            print("\n⚠️  Skipping booking retrieval test - no booking ID available")
            return False
            
        print(f"\n🔍 Testing GET /api/bookings/{booking_id}...")
        
        try:
            response = requests.get(
                f"{self.api_url}/bookings/{booking_id}", 
                headers=self.headers,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                response_data = response.json()
                print("✅ Booking Retrieval: PASSED")
                print(f"   Retrieved Data: {json.dumps(response_data, indent=2)}")
                return True
            else:
                print(f"❌ Booking Retrieval: FAILED - Status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Booking Retrieval: FAILED - {str(e)}")
            return False
    
    def test_cors_headers(self):
        """Test CORS headers for frontend communication"""
        print("\n🔍 Testing CORS headers...")
        
        try:
            response = requests.options(
                f"{self.api_url}/bookings",
                headers={
                    'Origin': 'https://madina-tours.preview.emergentagent.com',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=10
            )
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            print(f"   CORS Headers: {cors_headers}")
            
            if cors_headers['Access-Control-Allow-Origin']:
                print("✅ CORS Configuration: PASSED")
                return True
            else:
                print("❌ CORS Configuration: FAILED - Missing CORS headers")
                return False
                
        except Exception as e:
            print(f"❌ CORS Test: FAILED - {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test API error handling with invalid data"""
        print("\n🔍 Testing error handling with invalid data...")
        
        # Test with missing required fields
        invalid_booking = {
            "name": "Test User",
            # Missing email, phone, etc.
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/bookings", 
                json=invalid_booking, 
                headers=self.headers,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 422:  # Pydantic validation error
                print("✅ Error Handling: PASSED - Proper validation error returned")
                try:
                    error_data = response.json()
                    print(f"   Validation Error: {json.dumps(error_data, indent=2)}")
                except:
                    pass
                return True
            else:
                print(f"❌ Error Handling: FAILED - Expected 422, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error Handling Test: FAILED - {str(e)}")
            return False

def main():
    print("🚀 Madinah Ziyarat Booking API Verification Test")
    print("=" * 60)
    print("Testing backend API endpoints for booking functionality")
    print(f"API Base URL: https://madina-tours.preview.emergentagent.com/api")
    print("=" * 60)
    
    tester = BookingVerificationTester()
    
    # Track test results
    tests_passed = 0
    total_tests = 5
    
    # Test 1: API Health
    if tester.test_api_health():
        tests_passed += 1
    
    # Test 2: Booking creation with sample data
    booking_success, booking_id = tester.test_booking_endpoint_with_sample_data()
    if booking_success:
        tests_passed += 1
    
    # Test 3: Booking retrieval (MongoDB verification)
    if tester.test_booking_retrieval(booking_id):
        tests_passed += 1
    
    # Test 4: CORS headers
    if tester.test_cors_headers():
        tests_passed += 1
    
    # Test 5: Error handling
    if tester.test_error_handling():
        tests_passed += 1
    
    # Final results
    print("\n" + "=" * 60)
    print("📊 VERIFICATION TEST RESULTS")
    print("=" * 60)
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    print(f"Success Rate: {(tests_passed/total_tests*100):.1f}%")
    
    if tests_passed == total_tests:
        print("🎉 All verification tests PASSED!")
        print("✅ Backend API is working correctly with frontend")
        return 0
    else:
        print("⚠️  Some verification tests FAILED")
        print("❌ Backend API needs attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())