/**
 * Elenco curato di marche auto, per suggerire un nome quando l'admin ne crea
 * una nuova: niente API esterna, quindi niente rischio che sparisca o abbia
 * la filigrana (i tentativi con servizi di terze parti sono documentati nel
 * README). E' un suggerimento, non un vincolo: il campo resta un testo
 * libero, e una marca non in questa lista si scrive comunque a mano — serve
 * proprio per quando ne esce una nuova sul mercato.
 */
export const MARCHE_NOTE = [
  'Abarth', 'Alfa Romeo', 'Alpine', 'Aston Martin', 'Audi',
  'Bentley', 'BMW', 'Bugatti', 'Buick', 'BYD',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Citroën', 'Cupra',
  'Dacia', 'Daewoo', 'Daihatsu', 'Dodge', 'DS Automobiles',
  'Ferrari', 'Fiat', 'Fisker', 'Ford',
  'Genesis', 'GMC', 'Great Wall', 'Honda', 'Hyundai',
  'Infiniti', 'Isuzu', 'Iveco', 'Jaguar', 'Jeep',
  'Kia', 'Koenigsegg', 'Lada', 'Lamborghini', 'Lancia',
  'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati',
  'Maybach', 'Mazda', 'McLaren', 'Mercedes-Benz', 'MG',
  'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Pagani',
  'Peugeot', 'Polestar', 'Pontiac', 'Porsche', 'RAM',
  'Renault', 'Rolls-Royce', 'Saab', 'SEAT', 'Škoda',
  'Smart', 'SsangYong', 'Subaru', 'Suzuki', 'Tesla',
  'Toyota', 'Volkswagen', 'Volvo',
]
