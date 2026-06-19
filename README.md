<<<<<<< HEAD
# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
=======
Ladder logic understanding 

Complete Technical Specification: Delta ISPSoft 4-Axis Motion Control System
Document Version: 8.0 (Ultimate Master Release – Full Speed Pipeline Explanation)
Date: June 2026
PLC Hardware: Delta AS228T
System Type: 4-Axis Hybrid Stepper & Analog Drive Motion Control

1. Project Overview
PLC Platform: Delta AS-Series (AS228T) using ISPSoft.

Core Function: 4-axis motion control using 2 Stepper Pulse outputs (for XY movement) and 4 Analog Drive outputs (for variable frequency motor control).

Control Modes (Per Analog Axis):

Manual Mode: Driven by physical selector switches (MA~ inputs) and independent manual speed modifiers.

Automatic Mode: Driven by physical selector switches (AU~ inputs) and a 2-sensor Start/End safety latch.

Stepper Control: UP/DOWN/LEFT/RIGHT pushbuttons control 2 steppers in a Cartesian/X-Y layout.

2. Functional Block: Prog0 (Main Logic & Math Engine)
File Reference: Programs > Prog0 [PRG].

2.1. Stepper Motor Outputs (Network 1)
This logic handles the physical stepping of motors 1 and 2 via the DPLSY instruction.

Component	Function
STEPPER Function Block	Takes physical jog inputs (X0.3 to X0.6) and generates logical direction commands (M0, M1, Y0.8, Y0.9).
DPLSY (Stepper 1)	Outputs physical pulses to Y0.0. Speed dictated by D2000 & D2002. Enabled by M0 coil.
DPLSY (Stepper 2)	Outputs physical pulses to Y0.1. Speed dictated by D2004 & D2006. Enabled by M1 coil.
2.2. Axis Mathematics & Speed Scaling (Network 2)
This is the linear scaling engine. It uses a 3-step pipeline to calculate speeds for Low, High, and Manual ranges.

The Calculation Pipeline:

Float Multiply (F*): Takes a modifier (e.g., D20002) and multiplies it by the base frequency (32010).

Float Move (F): Temporarily stores the result in a register.

Integer Conversion (DINT): Converts the floating-point decimal into an integer for the PLC hardware.

Conditional Move (DMOV): If the corresponding physical switches are active, the integer is moved to the Master Target Register (e.g., D28022).

2.3. Analog Output Control (Network 4)
This block maps the calculated speeds to physical analog outputs.

Block Instance	Physical Output	Drive Name	Start Pin (SE~)	End Pin (SENS~)	Auto Mode Pin (AU~)	Manual Mode Pin (MA~)
ANALOG0	Y0.2	Drive 1	X0.9	X0.10	X0.1	X0.2
ANALOG1	Y0.3	Drive 2	X0.11	X0.12	X1.1	X1.2
ANALOG2	Y0.4	Drive 3	X0.13	X0.14	X1.3	X1.4
ANALOG3	Y0.5	Drive 4	X0.15	X1.0	X1.5	X1.6
2.4. Modbus Communication (Network 6)
Instruction: MODRW (Write Single Register).

Slave Address: 2; Function Code: 6; Target Register: 16#2001; Data Source: D20026.

3. FUNCTIONAL BLOCK: STEPPER (Directional Jog Logic)
File Reference: Function Blocks > STEPPER.

Internal Logic Truth Table:

Operator Action	Physical Input	Motor 1 Command	Motor 2 Command	Machine Movement
Press UP	X0.3	STP1 (Forward)	STP2 (Forward)	Both motors move FORWARD simultaneously
Press DOWN	X0.4	REV_STP1 (Reverse)	REV_STP2 (Reverse)	Both motors move REVERSE simultaneously
Press LEFT	X0.5	STP1 (Forward)	(Inactive)	Motor 1 moves FORWARD
Press RIGHT	X0.6	(Inactive)	STP2 (Forward)	Motor 2 moves FORWARD
4. FUNCTIONAL BLOCK: ANALOG (Drive Enable & Mode Selector)
File Reference: Function Blocks > ANALOG.

4.1. Block Instances & Status
Active Instances: ANALOG0 through ANALOG3 (These are wired to physical inputs and outputs in Prog0 Network 4).

Spare/Reserve Instances: ANALOG4 through ANALOG8 (These are defined in the Function Block tree, but not wired to any physical I/O in the program. They are available for future expansion).

4.2. Internal Logic (Network 2)
This exact logic is duplicated inside every instance from 0 to 8. It acts as a safety-latched state machine.

Branch 1: Auto Start/End Latch (Interlocks)

Triggering SENSOR1 (Start pin) executes a SET (Latch) instruction on the A_DRIVE_ON flag.

Triggering SENSOR2 (End pin) executes a RESET (Unlatch) instruction on the A_DRIVE_ON flag.

How it functions physically: You must trigger the Start sensor to latch the drive ON. Triggering the End sensor will unlatch and stop the drive.

Branch 2: Manual vs Auto Arbitration (Mutual Exclusion)

If MAN_SIGNAL is ON → M_DRIVE_ON is Set.

If MAN_SIGNAL is OFF AND AUTO_SIGNAL is ON → A_DRIVE_ON is Set, and M_DRIVE_ON is Reset.

Manual mode takes priority. Auto and Manual cannot be active simultaneously.

Branch 3: Master Enable Output

The DRIVE_ON output coil turns ON if either A_DRIVE_ON OR M_DRIVE_ON is active.

A master physical interlock (X0.6) is also wired in series to allow the final output to pass through safely.

5. DEEP DIVE: The Speed Control Pipeline (How the speed is calculated)
To truly understand how your machine's speed is controlled, we must trace the signal from the operator's entry all the way to the physical motor. It follows a 5-step digital pipeline:

Step 1: The Operator's Input (The Modifier)
The operator enters a numerical "modifier" (usually a decimal) into specific Data Registers via an HMI touchscreen.

Example: To set Axis 1's low speed, the HMI writes 0.5 into register D20002.

Step 2: The Math Engine (Multiplication)
The PLC executes a F* (Float Multiply) instruction. It multiplies the user's modifier by a hard-coded Base Frequency constant of 32,010.

Mathematical formula: User Modifier × 32,010

Example calculation: 0.5 × 32,010 = 16,005.0

Step 3: Format Conversion (Float to Integer)
The PLC executes a DINT (Double Integer) instruction. This strips the decimal and converts 16,005.0 into a clean integer 16,005.

Why? Stepper motor drivers and analog VFDs do not understand decimals. They can only process whole number frequencies (Hz).

Step 4: The Safety Gate (Conditional Move)
The integer (16,005) sits in temporary memory. It is NOT sent to the machine yet. The ladder logic checks the physical switches:

If the SENS~ (End Sensor) AND the AU~ (Auto Switch) are both physically closed...

Then the DMOV instruction executes, writing 16,005 into the Master Target Register D28022.

If the sensors are open, D28022 stays at 0 and the motor stops.

Step 5: Physical Output to Hardware (The DRIVE_ON State)
The ANALOG0 block looks at the DRIVE_ON flag.

If DRIVE_ON is TRUE (latched on by the Start sensor), the block sends the speed integer (16,005) to physical output pin Y0.2.

The pin converts this integer into a proportional Analog Voltage (e.g., 0-10V).

The physical VFD drive receives 5V, and your motor spins at exactly 16,005 Hz.

6. System Integration & IoT Upgrade Path
The system is built for future remote control via a Raspberry Pi and Modbus TCP.

RPi writes to: D28022, D28024, D28026, D28028 (the Master Target Registers).

Authentication: Tablet (MAC address) → RPi (whitelist.txt) → Modbus TCP to PLC.

7. Appendix A: Exhaustive Master I/O Mapping
Physical Address	Logical Name / Function	Used In
Inputs (X)		
X0.1	MC1 AUTO (Axis 1 Auto Selector)	Math + Network 4 ANALOG0
X0.2	MC1 MANUAL (Axis 1 Manual Selector)	Math + Network 4 ANALOG0
X0.3	UP Pushbutton	Network 1 STEPPER
X0.4	DOWN Pushbutton	Network 1 STEPPER
X0.5	LEFT Pushbutton	Network 1 STEPPER
X0.6	RIGHT Pushbutton	Network 1 STEPPER
X0.9	MC1 SEN1 (Axis 1 Start / Latch ON)	Network 4 ANALOG0
X0.10	MC1 SEN2 (Axis 1 End / Reset OFF)	Math + Network 4 ANALOG0
X0.11	MC2 SEN1 (Axis 2 Start / Latch ON)	Network 4 ANALOG1
X0.12	MC2 SEN2 (Axis 2 End / Reset OFF)	Math + Network 4 ANALOG1
X0.13	MC3 SEN1 (Axis 3 Start / Latch ON)	Network 4 ANALOG2
X0.14	MC3 SEN2 (Axis 3 End / Reset OFF)	Math + Network 4 ANALOG2
X0.15	MC4 SEN1 (Axis 4 Start / Latch ON)	Network 4 ANALOG3
X1.0	MC4 SEN2 (Axis 4 End / Reset OFF)	Math + Network 4 ANALOG3
X1.1	MC2 AUTO (Axis 2 Auto Selector)	Math + Network 4 ANALOG1
X1.2	MC2 MANUAL (Axis 2 Manual Selector)	Math + Network 4 ANALOG1
X1.3	MC3 AUTO (Axis 3 Auto Selector)	Math + Network 4 ANALOG2
X1.4	MC3 MANUAL (Axis 3 Manual Selector)	Math + Network 4 ANALOG2
X1.5	MC4 AUTO (Axis 4 Auto Selector)	Math + Network 4 ANALOG3
X1.6	MC4 MANUAL (Axis 4 Manual Selector)	Math + Network 4 ANALOG3
Outputs (Y)		
Y0.0	Stepper 1 Pulse	Network 1 DPLSY
Y0.1	Stepper 2 Pulse	Network 1 DPLSY
Y0.2	Drive 1 Analog Output	Network 4 ANALOG0
Y0.3	Drive 2 Analog Output	Network 4 ANALOG1
Y0.4	Drive 3 Analog Output	Network 4 ANALOG2
Y0.5	Drive 4 Analog Output	Network 4 ANALOG3
Y0.8	Stepper 1 Direction (Reverse)	Network 1 STEPPER
Y0.9	Stepper 2 Direction (Reverse)	Network 1 STEPPER
8. Appendix B: Math Engine Data Registers
Register	Description	Axis
D20002	Low Speed Modifier	MC1
D20004	High Speed Modifier	MC1
D20006	Manual Speed Modifier	MC1
D20008	Low Speed Modifier	MC2
D20010	High Speed Modifier	MC2
D20012	Manual Speed Modifier	MC2
D20014	Low Speed Modifier	MC3
D20016	High Speed Modifier	MC3
D20018	Manual Speed Modifier	MC3
D20020	Low Speed Modifier	MC4
D20022	High Speed Modifier	MC4
D20024	Manual Speed Modifier	MC4
D28022	Final Master Target Speed	MC1
D28024	Final Master Target Speed	MC2
D28026	Final Master Target Speed	MC3
D28028	Final Master Target Speed	MC4
D20026	Modbus Data Source	Modbus Network 6
9. Appendix C: Mathematical Algorithm Formula
Final Speed (Integer) = [ Modifier (Dxxxxx) × Base Frequency (32,010) ] (Converted via DINT instruction)

10. Critical Troubleshooting & Maintenance Notes
Why ANALOG4 to ANALOG8 don't work: They are defined in the Function Blocks tree but are not wired to physical pins in the Prog0 main program (Network 4). They are backup instances only.

Stepper not moving in Jog: Check Y0.0 and Y0.1. Ensure M0/M1 coils are latching. Verify D2000 and D2004 are not 0.

Analog Drive not turning on in Auto Mode:

You must first trigger SENSOR1 (the Start pin, e.g., X0.9). This SETs the internal latch.
Next, turn on the AUTO_SIGNAL switch.
Check: Ensure SENSOR2 (the End pin, e.g., X0.10) is OFF. If the End pin is triggered, the latch is RESET and the drive will never turn on.
Modbus not communicating: Verify Port 502 is open. Check slave ID 2 and target address 16#2001. Use ISPSoft Watch window to monitor D20026.

End of Document

