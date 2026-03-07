import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
        onNeedRefresh() {
            toast("Atualização Disponível", {
                description: "Uma nova versão do sistema GestaoGOR está disponível.",
                action: {
                    label: "Atualizar",
                    onClick: () => updateServiceWorker(true)
                },
                duration: Infinity, // Keep open until user clicks
            });
        },
        onOfflineReady() {
            toast.success("App pronto para uso offline", {
                description: "A interface foi armazenada no cache.",
                duration: 5000,
            })
        }
    })

    // The visual output is handled by Sonner Toasts
    return null;
}
