import requests
import sys
import json
from datetime import datetime, timedelta
import time

class MadinahToursAPITester:
    def __init__(self, base_url="https://madina-tours.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.booking_id = None
        self.session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n=== HEALTH CHECK TESTS ===")
        
        # Test root endpoint
        success, _ = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        
        # Test health endpoint
        success, _ = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        
        return success

    def test_sites_endpoints(self):
        """Test historical sites endpoints"""
        print("\n=== SITES ENDPOINTS TESTS ===")
        
        # Test get all sites
        success, sites_data = self.run_test(
            "Get All Sites",
            "GET",
            "sites",
            200
        )
        
        if success and sites_data:
            print(f"   Found {len(sites_data)} sites")
            
            # Test get specific site if sites exist
            if len(sites_data) > 0:
                site_id = sites_data[0].get('id')
                if site_id:
                    success, _ = self.run_test(
                        "Get Specific Site",
                        "GET",
                        f"sites/{site_id}",
                        200
                    )
        
        return success

    def test_booking_creation(self):
        """Test booking creation"""
        print("\n=== BOOKING CREATION TESTS ===")
        
        # Test contact booking
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        booking_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+1234567890",
            "site_id": 1,
            "site_name": "Quba Mosque",
            "group_size": 2,
            "date": tomorrow,
            "time": "10:00",
            "special_requests": "Test booking request",
            "total_price": 240.0,
            "booking_type": "contact"
        }
        
        success, booking_response = self.run_test(
            "Create Contact Booking",
            "POST",
            "bookings",
            200,
            data=booking_data
        )
        
        if success and booking_response:
            self.booking_id = booking_response.get('id')
            print(f"   Created booking ID: {self.booking_id}")
            
            # Test get booking by ID
            if self.booking_id:
                success, _ = self.run_test(
                    "Get Booking by ID",
                    "GET",
                    f"bookings/{self.booking_id}",
                    200
                )
        
        # Test payment booking
        payment_booking_data = booking_data.copy()
        payment_booking_data["booking_type"] = "payment"
        payment_booking_data["email"] = "payment@example.com"
        
        success, payment_booking_response = self.run_test(
            "Create Payment Booking",
            "POST",
            "bookings",
            200,
            data=payment_booking_data
        )
        
        return success

    def test_booking_status_update(self):
        """Test booking status update"""
        print("\n=== BOOKING STATUS UPDATE TESTS ===")
        
        if not self.booking_id:
            print("❌ No booking ID available for status update test")
            return False
        
        success, _ = self.run_test(
            "Update Booking Status",
            "PUT",
            f"bookings/{self.booking_id}/status",
            200,
            params={"status": "confirmed"}
        )
        
        return success

    def test_payment_endpoints(self):
        """Test payment-related endpoints"""
        print("\n=== PAYMENT ENDPOINTS TESTS ===")
        
        if not self.booking_id:
            print("❌ No booking ID available for payment tests")
            return False
        
        # Test create checkout session
        payment_request = {
            "booking_id": self.booking_id,
            "success_url": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
            "cancel_url": "https://example.com/cancel"
        }
        
        success, session_response = self.run_test(
            "Create Checkout Session",
            "POST",
            "payments/checkout/session",
            200,
            data=payment_request
        )
        
        if success and session_response:
            self.session_id = session_response.get('session_id')
            print(f"   Created session ID: {self.session_id}")
            
            # Test get checkout status
            if self.session_id:
                success, _ = self.run_test(
                    "Get Checkout Status",
                    "GET",
                    f"payments/checkout/status/{self.session_id}",
                    200
                )
        
        return success

    def test_user_endpoints(self):
        """Test user-related endpoints"""
        print("\n=== USER ENDPOINTS TESTS ===")
        
        user_data = {
            "name": "Test User",
            "email": "testuser@example.com",
            "phone": "+1234567890"
        }
        
        success, user_response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=user_data
        )
        
        if success and user_response:
            user_email = user_response.get('email')
            if user_email:
                success, _ = self.run_test(
                    "Get User by Email",
                    "GET",
                    f"users/{user_email}",
                    200
                )
        
        return success

    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n=== ANALYTICS ENDPOINTS TESTS ===")
        
        success, _ = self.run_test(
            "Get Booking Analytics",
            "GET",
            "analytics/bookings",
            200
        )
        
        return success

    def test_get_bookings(self):
        """Test get bookings endpoint"""
        print("\n=== GET BOOKINGS TESTS ===")
        
        # Test get all bookings
        success, _ = self.run_test(
            "Get All Bookings",
            "GET",
            "bookings",
            200
        )
        
        # Test get bookings by email
        success, _ = self.run_test(
            "Get Bookings by Email",
            "GET",
            "bookings",
            200,
            params={"user_email": "test@example.com"}
        )
        
        return success

def main():
    print("🚀 Starting Madinah Historical Tours API Tests")
    print("=" * 60)
    
    tester = MadinahToursAPITester()
    
    # Run all tests
    tests = [
        tester.test_health_check,
        tester.test_sites_endpoints,
        tester.test_booking_creation,
        tester.test_booking_status_update,
        tester.test_payment_endpoints,
        tester.test_user_endpoints,
        tester.test_analytics_endpoints,
        tester.test_get_bookings
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the logs above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())