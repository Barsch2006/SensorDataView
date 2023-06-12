setInterval(() => {
    self.registration.showNotification('Time is up!', {
        body: 'Schau dir die Daten der letzten Stunde an!',
        icon: 'new.svg',
    });
}, 3600000); // (1 Stunde)
