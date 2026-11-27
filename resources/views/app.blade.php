<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#0F172A">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Rubelia">

        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=jetbrains-mono:500,600|outfit:600,700|plus-jakarta-sans:400,500,600,700&display=swap" rel="stylesheet" />

        <style>
            html {
                background-color: #F8FAFC;
                color: #0F172A;
            }
        </style>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Rubelia') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased bg-background text-foreground selection:bg-[#FEF9C3] selection:text-[#0F172A]">
        <x-inertia::app />
    </body>
</html>
