self.addEventListener('install', () => {
    // Força a nova 'arma de deleção' a assumir imediatamente, ignorando tempo de espera
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        // Passo 1: Caça e deleta todos os caches antigos do Vite (css, html velho, etc)
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('SW Suicida: Deletando cache obsoleto', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Passo 2: Se autodestrói (Unregister) para nunca mais voltar
            console.log('SW Suicida: Caches deletados. Me desativando para sempre...');
            return self.registration.unregister();
        }).then(() => {
            // Passo 3: Força todas as abas abertas pelo usuário a recarregarem limpas do zero
            return self.clients.matchAll({ type: 'window' }).then(windowClients => {
                for (let windowClient of windowClients) {
                    windowClient.navigate(windowClient.url);
                }
            });
        })
    );
});
