#define CAM_ONE_PIN     2
#define CAM_TWO_PIN     4
#define CAM_THREE_PIN   6
#define DEBUG_PIN       10
#define DEBUG1_PIN       7
#define SERIAL_COM_SPEED 9600

#define NO_COM_TIMEOUT  10

boolean availableCom =false;
char noComCnt = 0; 

void setup() {
  pinMode(CAM_ONE_PIN, OUTPUT);
  pinMode(CAM_TWO_PIN, OUTPUT);
  pinMode(CAM_THREE_PIN, OUTPUT);
  pinMode(DEBUG_PIN, OUTPUT);
  pinMode(DEBUG1_PIN, OUTPUT);

  digitalWrite(CAM_ONE_PIN, LOW);
  digitalWrite(CAM_TWO_PIN, LOW);
  digitalWrite(CAM_THREE_PIN, LOW);
  digitalWrite(DEBUG_PIN, LOW);

  //Start TIMER1 - 16bit 
  cli(); //disable interrupts
  TCCR1A = 0;
  TCCR1B = 0;
  TCNT1 = 0;

  OCR1A = 15624; //16*10^6 /(1*1024 - 1) (must be  less then 65535)

  TCCR1B |= (1 << WGM12);
  TCCR1B |= (1 << CS12) | (1 << CS10);
  TIMSK1 |= (1 << OCIE1A);
  sei();//enable interrupts
  Serial.begin(SERIAL_COM_SPEED);
}

void loop() {
  char inComByte;
  digitalWrite(DEBUG1_PIN, HIGH);
  if(Serial.available()> 0){
      availableCom = true;
      digitalWrite(DEBUG_PIN, HIGH);
      
      inComByte = Serial.read();
      Serial.write("Message received!");
      
      if('0' == inComByte){
          digitalWrite(CAM_ONE_PIN, LOW);
          digitalWrite(CAM_TWO_PIN, LOW);
          digitalWrite(CAM_THREE_PIN, LOW);
      }else if('1' == inComByte){
          digitalWrite(CAM_ONE_PIN, HIGH);
          digitalWrite(CAM_TWO_PIN, LOW);
          digitalWrite(CAM_THREE_PIN, LOW);
      }else if('2' == inComByte){
           digitalWrite(CAM_ONE_PIN, LOW);
           digitalWrite(CAM_TWO_PIN, HIGH);
           digitalWrite(CAM_THREE_PIN, LOW);
      }else if('3' == inComByte){
            digitalWrite(CAM_ONE_PIN, LOW);
            digitalWrite(CAM_TWO_PIN, LOW);
            digitalWrite(CAM_THREE_PIN, HIGH);
      }else{
            digitalWrite(CAM_ONE_PIN, LOW);
            digitalWrite(CAM_TWO_PIN, LOW);
            digitalWrite(CAM_THREE_PIN, LOW);
      }
   }else{
        availableCom = false;
   }
}

ISR(TIMER1_COMPA_vect)
{
    TCNT1 = 0; // Reset the timer;
    if(false == availableCom)
    {
        if(NO_COM_TIMEOUT > noComCnt){
            noComCnt++;
        }
    }else{
        noComCnt = 0;  
    }

    if(NO_COM_TIMEOUT == noComCnt)
    {
        digitalWrite(DEBUG_PIN, LOW);
    }
}
