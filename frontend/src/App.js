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
    name: "Quba Mosque",
    nameArabic: "مسجد قباء",
    description: "The first mosque ever built in Islam, established by Prophet Muhammad (PBUH) after Hijrah",
    significance: "First mosque in Islamic history",
    duration: "2 hours",
    distance: "6 km from city center",
    image: "https://images.unsplash.com/photo-1707044640598-828ee7db5dca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxRdWJhJTIwTW9zcXVlJTIwTWFkaW5haHxlbnwwfHx8fDE3NTgyMjkxMTZ8MA&ixlib=rb-4.1.0&q=85",
    price: 120,
    rating: 4.9
  },
  {
    id: 2,
    name: "Mount Uhud",
    nameArabic: "جبل أحد",
    description: "Historic site of the Battle of Uhud, where Prophet Muhammad (PBUH) and his companions fought",
    significance: "Battle of Uhud historical site",
    duration: "3 hours",
    distance: "6.4 km north of Madinah",
    image: "https://images.unsplash.com/photo-1736240713478-00d2d3043d7d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxNb3VudCUyMFVodWR8ZW58MHx8fHwxNzU4MjI5MTQ5fDA&ixlib=rb-4.1.0&q=85",
    price: 150,
    rating: 4.8
  },
  {
    id: 3,
    name: "Masjid Qiblatain",
    nameArabic: "مسجد القبلتين",
    description: "The mosque where the Qibla direction was changed from Jerusalem to Makkah",
    significance: "Historic Qibla direction change",
    duration: "1.5 hours",
    distance: "5 km from city center",
    image: "https://images.unsplash.com/photo-1572358899655-f63ece97bfa5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxNYWRpbmFoJTIwbW9zcXVlfGVufDB8fHx8MTc1ODIyOTE1OXww&ixlib=rb-4.1.0&q=85",
    price: 100,
    rating: 4.7
  },
  {
    id: 4,
    name: "Seven Mosques",
    nameArabic: "المساجد السبعة",
    description: "Historic mosques near the site of the Battle of the Trench",
    significance: "Battle of the Trench historical site",
    duration: "2.5 hours",
    distance: "4 km from city center",
    image: "https://images.unsplash.com/photo-1635829576353-1a14caec2f6f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwyfHxNYWRpbmFoJTIwbW9zcXVlfGVufDB8fHx8MTc1ODIyOTE1OXww&ixlib=rb-4.1.0&q=85",
    price: 130,
    rating: 4.6
  },
  {
    id: 5,
    name: "Jannat al-Baqi",
    nameArabic: "جنة البقيع",
    description: "The ancient cemetery where many of the Prophet's companions are buried",
    significance: "Sacred burial ground",
    duration: "1 hour",
    distance: "2 km from Masjid an-Nabawi",
    image: "https://images.unsplash.com/photo-1711262114827-f955beb4fc6c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxRdWJhJTIwTW9zcXVlJTIwTWFkaW5haHxlbnwwfHx8fDE3NTgyMjkxMTZ8MA&ixlib=rb-4.1.0&q=85",
    price: 80,
    rating: 4.9
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
    specialRequests: ''
  });
  const [showBooking, setShowBooking] = useState(false);
  const [bookingType, setBookingType] = useState('contact'); // 'contact' or 'payment'

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSite || !bookingData.date || !bookingData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const bookingPayload = {
        ...bookingData,
        siteId: selectedSite.id,
        siteName: selectedSite.name,
        totalPrice: selectedSite.price * bookingData.groupSize,
        bookingType
      };

      const response = await axios.post(`${API}/bookings`, bookingPayload);
      
      if (bookingType === 'contact') {
        toast.success("Booking request submitted! We'll contact you soon.");
      } else {
        toast.success("Booking confirmed! Payment details sent to your email.");
      }
      
      setShowBooking(false);
      setBookingData({
        name: '',
        email: '',
        phone: '',
        groupSize: 1,
        date: null,
        time: '',
        specialRequests: ''
      });
    } catch (error) {
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
            backgroundImage: `url('https://images.unsplash.com/photo-1721401609038-025bcde7388b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxJc2xhbWljJTIwYXJjaGl0ZWN0dXJlJTIwTWFkaW5haHxlbnwwfHx8fDE3NTgyMjkxMjF8MA&ixlib=rb-4.1.0&q=85')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
            Discover Madinah's
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Sacred Heritage
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-gray-200 leading-relaxed">
            Journey through the most historically significant Islamic sites in Madinah. 
            Book your guided round-trip tours to sacred locations.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-amber-500/25 transform hover:scale-105 transition-all duration-300"
            onClick={() => document.getElementById('tours').scrollIntoView({ behavior: 'smooth' })}
          >
            Explore Sacred Sites
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
              Discover the sacred locations that shaped Islamic history in the blessed city of Madinah
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
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {site.distance}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-2xl font-bold text-amber-700">
                      ${site.price}
                      <span className="text-sm font-normal text-gray-500">/person</span>
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
              <Tabs value={bookingType} onValueChange={setBookingType} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="contact">Contact Booking</TabsTrigger>
                  <TabsTrigger value="payment">Pay Now</TabsTrigger>
                </TabsList>
                
                <TabsContent value="contact" className="mt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Submit your booking request and we'll contact you with payment details
                  </p>
                </TabsContent>
                
                <TabsContent value="payment" className="mt-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Complete your booking with instant confirmation and payment
                  </p>
                </TabsContent>
              </Tabs>

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
                      required
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
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Person' : 'People'}</SelectItem>
                        ))}
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
                        <SelectItem value="08:00">8:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Duration:</strong> {selectedSite.duration}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Distance:</strong> {selectedSite.distance}
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
                    <span>Price per person:</span>
                    <span>${selectedSite.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Group size:</span>
                    <span>{bookingData.groupSize} {bookingData.groupSize === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-amber-700">${selectedSite.price * bookingData.groupSize}</span>
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
                  >
                    {bookingType === 'contact' ? (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay & Book Now
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
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