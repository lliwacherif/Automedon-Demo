<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <!-- Header -->
            <div class="text-center mb-12">
                <img src="/images/miams logo.jpg" alt="MIAMS Logo" class="h-24 w-24 mx-auto mb-6 object-contain" />
                <h1 class="text-4xl font-bold text-gray-900 mb-4">MIAM'S Rent Car</h1>
                <p class="text-xl text-gray-600">Agence de location de voitures a sousse tunisie</p>
                <div class="mt-4 flex flex-col items-center justify-center space-y-2">
                    <a href="tel:+21655200702" class="text-lg font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                        <span class="mr-2">📞</span> +216 55 200 702
                    </a>
                    <a href="tel:+21655420444" class="text-lg font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                        <span class="mr-2">📞</span> +216 55 420 444
                    </a>
                </div>
            </div>

            <!-- About Content -->
            <div class="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4 text-right">About Us</h2>
                <div dir="rtl" class="text-right">
                    <p class="text-gray-600 leading-relaxed mb-6 text-lg">
                        مرحباً بكم في وكالة <strong>MIAM'S Rent Car</strong> لكراء السيارات في سوسة، تونس.
                    </p>
                    <p class="text-gray-600 leading-relaxed text-lg mb-4">
                        نحن نقدم لكم أفضل الخدمات بأسعار تنافسية وأسطول سيارات حديث ومتنوع يلبي جميع احتياجاتكم.
                    </p>
                    <p class="text-gray-600 leading-relaxed text-lg">
                        استمتعوا بتجربة تأجير سيارات مريحة وموثوقة معنا.
                    </p>
                </div>
            </div>

            <!-- Features -->
            <div class="bg-white rounded-lg shadow-md p-8">
                <h2 class="text-2xl font-semibold text-gray-800 mb-6">Why Choose Automedon?</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-800">Easy to Use</h3>
                            <p class="text-sm text-gray-600">Intuitive interface designed for efficiency</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-800">Real-time Updates</h3>
                            <p class="text-sm text-gray-600">Track your fleet status in real-time</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-800">Analytics & KPIs</h3>
                            <p class="text-sm text-gray-600">Detailed insights for your business</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-800">Secure & Reliable</h3>
                            <p class="text-sm text-gray-600">Your data is safe with us</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
