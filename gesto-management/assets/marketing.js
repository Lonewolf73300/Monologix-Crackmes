(()=>{'use strict';
const states={
 retard:['Une prise de poste n’est pas confirmée.','Le manager vérifie la situation et prépare un remplacement si nécessaire.','Confirmer, contacter ou préparer un plan B.','service'],
 pluie:['La terrasse risque d’être exposée à la pluie.','Créer une tâche « protéger la terrasse » avant le service.','Affecter la tâche et confirmer qu’elle a été exécutée.','service'],
 rupture:['Un article atteint son seuil de stock.','Signaler la quantité restante et préparer le réapprovisionnement.','Ajuster la commande et suivre la disponibilité.','inventory'],
 fermeture:['Le restaurant termine son service.','GStar réunit les contrôles, les tâches et les incidents de la journée.','Envoyer un bilan fidèle, y compris si des points restent ouverts.','brief']
};
const tabs=[...document.querySelectorAll('[data-scenario]')];
for(const btn of tabs)btn.addEventListener('click',()=>{let v=states[btn.dataset.scenario];if(!v)return;for(const t of tabs){t.classList.toggle('active',t===btn);t.setAttribute('aria-pressed',String(t===btn));}document.getElementById('scenario-problem').textContent=v[0];document.getElementById('scenario-plan').textContent=v[1];document.getElementById('scenario-choice').textContent=v[2];document.getElementById('scenario-demo').href='le-chamois-client001.html?role=manager&view='+v[3];});
})();
