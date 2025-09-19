import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Calendar, Clock, Users, MapPin, Star, Phone, Mail, User, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Calendar as CalendarComponent } from "./components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Historical locations data
const historicalSites = [
  {
    id: 1,
    name: "Masjid Quba",
    nameArabic: "مسجد قباء",
    description: "The first mosque ever built in Islam, established by Prophet Muhammad (PBUH) after Hijrah",
    significance: "First mosque in Islamic history",
    duration: "Flexible (1-10 hours)",
    image: "https://customer-assets.emergentagent.com/job_madinah-history/artifacts/ly49rk49_quba-mosque.jpg",
    price: 120,
    rating: 4.9
  },
  {
    id: 2,
    name: "Mount Uhud",
    nameArabic: "جبل أحد",
    description: "Historic site of the Battle of Uhud, where Prophet Muhammad (PBUH) and his companions fought",
    significance: "Battle of Uhud historical site",
    duration: "Flexible (1-10 hours)",
    image: "https://customer-assets.emergentagent.com/job_madinah-history/artifacts/dl55hk46_Uhud-Mountain.jpg",
    price: 150,
    rating: 4.8
  },
  {
    id: 3,
    name: "Masjid Qiblatain",
    nameArabic: "مسجد القبلتين",
    description: "The mosque where the Qibla direction was changed from Jerusalem to Makkah",
    significance: "Historic Qibla direction change",
    duration: "Flexible (1-10 hours)",
    image: "https://customer-assets.emergentagent.com/job_madinah-history/artifacts/m0vklizi_Qiblatain%20mosque.jpg",
    price: 100,
    rating: 4.7
  },
  {
    id: 4,
    name: "Trench Battle",
    nameArabic: "المساجد السبعة",
    description: "Historic mosques near the site of the Battle of the Trench",
    significance: "Battle of the Trench historical site",
    duration: "Flexible (1-10 hours)",
    image: "https://customer-assets.emergentagent.com/job_madinah-history/artifacts/ieodz8c4_Trench%20battle.jpg",
    price: 130,
    rating: 4.6
  },
  {
    id: 5,
    name: "Package",
    nameArabic: "باقة شاملة",
    description: "Complete tour package covering all major Islamic historical sites in Madinah",
    significance: "Comprehensive Islamic heritage experience",
    duration: "Flexible (1-10 hours)",
    image: "https://customer-assets.emergentagent.com/job_madinah-history/artifacts/3d6cr9b4_1.jpeg",
    price: 160,
    rating: 4.9
  },
  {
    id: 6,
    name: "Other Locations",
    nameArabic: "مواقع أخرى",
    description: "Visit other significant Islamic locations and landmarks in Madinah",
    significance: "Additional Islamic heritage sites",
    duration: "Flexible (1-10 hours)",
    image: "https://customer-assets.emergentagent.com/job_madinah-history/artifacts/kx6d3qf5_2.jpeg",
    price: 180,
    rating: 4.5
  }
];

const HomePage = () => {
  const [selectedSite, setSelectedSite] = useState(null);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    groupSize: 1,
    date: null,
    time: '',
    duration: 2, // Duration in hours (1-10)
    carType: 'sedan', // Car type: sedan or minivan
    visitType: 'masjid-quba', // Visit type: specific location
    paymentMethod: 'other', // Payment method: cash, other
    specialRequests: ''
  });
  const [showBooking, setShowBooking] = useState(false);
  const [bookingType, setBookingType] = useState('contact'); // 'contact' or 'payment'
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // New comprehensive pricing table
  const getPriceBySelection = (carType, visitType) => {
    const priceTable = {
      sedan: {
        'masjid-quba': 27,
        'mount-uhud': 27,
        'masjid-qiblatain': 24,
        'trench-battle': 24,
        'package': 32,
        'other-locations': 35
      },
      minivan: {
        'masjid-quba': 35,
        'mount-uhud': 35,
        'masjid-qiblatain': 30,
        'trench-battle': 30,
        'package': 40,
        'other-locations': 45
      }
    };
    
    return priceTable[carType]?.[visitType] || 27;
  };

  const currentPrice = getPriceBySelection(bookingData.carType, bookingData.visitType);

  // Check for payment return on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, []);

  const checkPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      toast.error('Payment status check timed out. Please check your email for confirmation.');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/checkout/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setPaymentStatus('success');
        toast.success('Payment successful! Your tour booking is confirmed.');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } else if (response.data.status === 'expired') {
        setPaymentStatus('expired');
        toast.error('Payment session expired. Please try again.');
        return;
      }

      // If payment is still pending, continue polling
      if (attempts === 0) {
        setPaymentStatus('processing');
        toast.info('Payment is being processed...');
      }
      
      setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
      toast.error('Error checking payment status. Please try again.');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSite || !bookingData.date || !bookingData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const bookingPayload = {
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        site_id: selectedSite.id,
        site_name: selectedSite.name,
        group_size: bookingData.groupSize,
        date: bookingData.date.toISOString().split('T')[0],
        time: bookingData.time,
        special_requests: bookingData.specialRequests,
        total_price: currentPrice ? currentPrice * bookingData.duration : 0,
        booking_type: 'contact'
      };

      const response = await axios.post(`${API}/bookings`, bookingPayload);
      
      toast.success("Booking request submitted! We'll contact you soon.");
      setShowBooking(false);
      setBookingData({
        name: '',
        email: '',
        phone: '',
        groupSize: 1,
        date: null,
        time: '',
        duration: 2,
        carType: 'sedan',
        visitType: 'masjid-quba',
        paymentMethod: 'other',
        specialRequests: ''
      });
    } catch (error) {
      setIsProcessingPayment(false);
      toast.error("Failed to submit booking. Please try again.");
      console.error('Booking error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://customer-assets.emergentagent.com/job_madinah-history/artifacts/jtnfvaio_prophet%20mosque.jpg')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
            Discover Madinah's
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Islamic Heritage
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-gray-200 leading-relaxed">
            Journey through the most historically significant Islamic sites in Madinah. 
            Book your guided round-trip tours to Islamic locations with Madinah Ziyarat.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-amber-500/25 transform hover:scale-105 transition-all duration-300"
            onClick={() => document.getElementById('tours').scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Islamic Sites
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tours Section */}
      <section id="tours" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Historical Islamic Sites
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the Islamic locations that shaped Islamic history in the blessed city of Madinah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {historicalSites.map((site) => (
              <Card key={site.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-0 overflow-hidden">
                <div className="relative overflow-hidden">
                  <img 
                    src={site.image} 
                    alt={site.name}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <Badge className="absolute top-4 right-4 bg-amber-600 text-white">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {site.rating}
                  </Badge>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    {site.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-amber-700 font-medium">
                    {site.nameArabic}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {site.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {site.duration}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg font-semibold text-gray-700">
                      
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedSite(site);
                        setShowBooking(true);
                      }}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-full px-6"
                    >
                      Book Tour
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Status Display */}
      {paymentStatus && (
        <div className="fixed top-4 right-4 z-50">
          <Card className={`w-96 ${
            paymentStatus === 'success' ? 'border-green-500 bg-green-50' :
            paymentStatus === 'processing' ? 'border-amber-500 bg-amber-50' :
            'border-red-500 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {paymentStatus === 'success' && <div className="w-4 h-4 bg-green-500 rounded-full"></div>}
                {paymentStatus === 'processing' && <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>}
                {(paymentStatus === 'error' || paymentStatus === 'expired' || paymentStatus === 'timeout') && 
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>}
                <div>
                  <p className="font-medium">
                    {paymentStatus === 'success' && 'Payment Successful!'}
                    {paymentStatus === 'processing' && 'Processing Payment...'}
                    {paymentStatus === 'error' && 'Payment Error'}
                    {paymentStatus === 'expired' && 'Payment Expired'}
                    {paymentStatus === 'timeout' && 'Payment Timeout'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {paymentStatus === 'success' && 'Your booking has been confirmed.'}
                    {paymentStatus === 'processing' && 'Please wait while we process your payment.'}
                    {(paymentStatus === 'error' || paymentStatus === 'expired' || paymentStatus === 'timeout') && 
                      'Please try booking again or contact support.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && selectedSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <CardTitle className="text-2xl">Book Your Tour</CardTitle>
              <CardDescription className="text-amber-100">
                {selectedSite.name} - {selectedSite.nameArabic}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline w-4 h-4 mr-1" />
                      Full Name
                    </label>
                    <Input
                      value={bookingData.name}
                      onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline w-4 h-4 mr-1" />
                      Phone Number
                    </label>
                    <Input
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                      required
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="inline w-4 h-4 mr-1" />
                      Group Size
                    </label>
                    <Select value={bookingData.groupSize.toString()} onValueChange={(value) => setBookingData({...bookingData, groupSize: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: bookingData.carType === 'sedan' ? 4 : 8}, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Person' : 'People'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🚗 Car Type
                    </label>
                    <Select value={bookingData.carType} onValueChange={(value) => {
                      setBookingData({
                        ...bookingData, 
                        carType: value,
                        groupSize: Math.min(bookingData.groupSize, value === 'sedan' ? 4 : 8)
                      });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan (Max 4 people)</SelectItem>
                        <SelectItem value="minivan">Mini Van (Max 8 people)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📋 Location Selection
                    </label>
                    <Select value={bookingData.visitType} onValueChange={(value) => setBookingData({...bookingData, visitType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masjid-quba">Masjid Quba</SelectItem>
                        <SelectItem value="mount-uhud">Mount Uhud</SelectItem>
                        <SelectItem value="masjid-qiblatain">Masjid Qiblatain</SelectItem>
                        <SelectItem value="trench-battle">Trench Battle</SelectItem>
                        <SelectItem value="package">Package</SelectItem>
                        <SelectItem value="other-locations">Other Locations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💳 Payment Method
                    </label>
                    <Select value={bookingData.paymentMethod} onValueChange={(value) => setBookingData({...bookingData, paymentMethod: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Pay cash at location (25% confirmation)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Tour Date
                    </label>
                    <CalendarComponent
                      mode="single"
                      selected={bookingData.date}
                      onSelect={(date) => setBookingData({...bookingData, date})}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Tour Time
                    </label>
                    <Select value={bookingData.time} onValueChange={(value) => setBookingData({...bookingData, time: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="06:00">6:00 AM</SelectItem>
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Tour Duration
                    </label>
                    <Select value={bookingData.duration.toString()} onValueChange={(value) => setBookingData({...bookingData, duration: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10].map(hours => (
                          <SelectItem key={hours} value={hours.toString()}>
                            {hours} {hours === 1 ? 'Hour' : 'Hours'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pricing Information
                    </label>
                    <div className="p-3 bg-amber-50 rounded-lg text-sm">
                      <p className="text-gray-700 mb-1">
                        <strong>Location:</strong> {
                          bookingData.visitType === 'masjid-quba' ? 'Masjid Quba' :
                          bookingData.visitType === 'mount-uhud' ? 'Mount Uhud' :
                          bookingData.visitType === 'masjid-qiblatain' ? 'Masjid Qiblatain' :
                          bookingData.visitType === 'trench-battle' ? 'Trench Battle' :
                          bookingData.visitType === 'package' ? 'Package' :
                          'Other Locations'
                        }
                      </p>
                      <p className="text-gray-700 mb-1">
                        <strong>Car type:</strong> {bookingData.carType === 'sedan' ? 'Sedan' : 'Mini Van'}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <strong>Payment:</strong> {
                          bookingData.paymentMethod === 'cash' ? 'Cash at location (25% confirmation)' :
                          'Other'
                        }
                      </p>
                      <p className="text-amber-700 font-semibold">
                        <strong>Price per hour:</strong> ${currentPrice}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (Optional)
                  </label>
                  <Textarea
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData({...bookingData, specialRequests: e.target.value})}
                    placeholder="Any special requirements or requests..."
                    rows={3}
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>Selected option:</span>
                    <span>{
                      bookingData.visitType === 'masjid-quba' ? 'Masjid Quba' :
                      bookingData.visitType === 'mount-uhud' ? 'Mount Uhud' :
                      bookingData.visitType === 'masjid-qiblatain' ? 'Masjid Qiblatain' :
                      bookingData.visitType === 'trench-battle' ? 'Trench Battle' :
                      bookingData.visitType === 'package' ? 'Package' :
                      'Other Locations'
                    }</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Car type:</span>
                    <span>{bookingData.carType === 'sedan' ? 'Sedan' : 'Mini Van'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Payment method:</span>
                    <span>{
                      bookingData.paymentMethod === 'cash' ? 'Cash at location' :
                      'Other'
                    }</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 border-t pt-2">
                    <span>Price per hour:</span>
                    <span className="font-semibold">${currentPrice}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Duration:</span>
                    <span>{bookingData.duration} {bookingData.duration === 1 ? 'hour' : 'hours'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Group size:</span>
                    <span>{bookingData.groupSize} {bookingData.groupSize === 1 ? 'person' : 'people'}</span>
                  </div>
                  {bookingData.paymentMethod === 'cash' && (
                    <div className="flex justify-between items-center mb-2 bg-yellow-50 p-2 rounded border-t">
                      <span>Confirmation fee (25%):</span>
                      <span className="font-semibold text-yellow-700">${Math.round(currentPrice * bookingData.duration * 0.25)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-amber-700">${currentPrice * bookingData.duration}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowBooking(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                    disabled={isProcessingPayment}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Contact Icons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        <a 
          href="https://wa.me/message/4ALJSEHXVS5BG1" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
          </svg>
        </a>
        <a 
          href="mailto:bdrsung@gmail.com"
          className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;