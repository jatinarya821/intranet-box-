// The text is available offline; the source link is for checking the original when online.
export const featuredGuides = [
  {
    id: 'featured-recovery-position',
    category: 'First Aid',
    title: 'Unresponsive but Breathing: Recovery Position',
    content: 'Illustrated first aid for an unresponsive person who is breathing normally: recovery position and monitoring.',
    source: {
      title: 'NHS 111 Wales, First aid: Recovery Position',
      url: 'https://111.wales.nhs.uk/encyclopaedia/f/article/firstaid?locale=en&term=A',
      checked: '12 November 2026',
      note: 'Summarized from NHS guidance. This guide does not replace hands-on first-aid training.',
    },
    sections: [
      {
        title: 'Check safety, response and breathing',
        text: 'Make sure the scene is safe. Check whether the person responds and call local emergency services. Look, listen and feel for normal breathing for up to 10 seconds. Gasping or irregular breaths are not normal breathing. If they are not breathing normally, start CPR and follow the emergency dispatcher’s instructions.',
      },
      {
        title: 'Turn them onto their side',
        text: 'Use the recovery position if they are unresponsive but breathing normally and have no injuries that prevent moving them. Kneel beside them. Put their near arm out at a right angle. Place the back of their far hand against the near cheek. Bend their far knee and gently pull it towards you to roll them onto their side, supporting their head with their hand.',
        image: {
          src: '/guides/recovery-steps.svg',
          alt: 'Five drawings show a rescuer positioning the arms and leg, rolling a person onto their side, and opening their airway.',
          caption: 'Illustrated sequence: positioning an unresponsive person who is breathing normally.',
          credit: 'Hibernate, based on work by Leone; unchanged; CC BY-SA 3.0.',
          url: 'https://commons.wikimedia.org/wiki/File:Stabilt_sidol%C3%A4ge.svg',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
        },
      },
      {
        title: 'Keep the airway open and watch their breathing',
        text: 'Position the bent leg at a right angle so the person stays on their side. Gently tilt the head back and lift the chin to keep the airway open. Stay with them and keep checking that they are breathing normally. If normal breathing stops, start CPR and follow the dispatcher’s instructions.',
        image: {
          src: '/guides/recovery-position.jpg',
          alt: 'Diagram of a person on their side with the top knee bent and a hand supporting their head.',
          caption: 'The final recovery position: on the side, with the top leg bent for stability.',
          credit: 'Rama; unchanged; CC BY-SA 3.0 France.',
          url: 'https://commons.wikimedia.org/wiki/File:Recovery_position.jpg',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/fr/',
        },
      },
      {
        title: 'If you suspect a neck or spinal injury',
        text: 'Avoid moving the person unless necessary for their safety or to open the airway. Call emergency services and follow their instructions. Keeping the airway open takes priority.',
      },
    ],
  },
  {
    id: 'featured-major-bleeding',
    category: 'First Aid',
    title: 'Major Bleeding: Get Help and Apply Pressure',
    content: 'Severe bleeding first aid: safety, direct pressure, embedded objects and urgent medical help.',
    source: {
      title: 'World Health Organization, Community First Aid Response Pocket Guide, page 3',
      url: 'https://cdn.who.int/media/docs/default-source/integrated-health-services-%28ihs%29/csy/cfar-pocketguide.pdf',
      checked: '12 November 2026',
      note: 'Summarized from WHO guidance. This summary was not created or endorsed by WHO.',
    },
    sections: [
      {
        title: 'Make the scene safe and get help',
        text: 'Check for danger before approaching. Get emergency help and arrange urgent transport to a medical facility. Major bleeding can be life-threatening.',
      },
      {
        title: 'Press on the bleeding wound',
        text: 'If available, wear gloves or use a protective barrier. Press firmly on the bleeding area with clean material. Maintain pressure. If blood comes through a dressing, add more material on top and continue pressing.',
      },
      {
        title: 'If an object is embedded',
        text: 'Do not remove it. Stabilize the object and press around it to control the bleeding.',
      },
      {
        title: 'If severe limb bleeding will not stop',
        text: 'Uncontrolled, life-threatening bleeding from an arm or leg may require a tourniquet. Apply one if available and you know how to use it, and get urgent medical help. Do not loosen it without guidance from a health professional. Note the application time and tell medical staff.',
      },
      {
        title: 'Continue care while getting help',
        text: 'Keep the person warm and calm. Continue pressing during transport if the wound is still bleeding. Give the receiving health worker the details of what happened and the care provided.',
      },
    ],
  },
  {
    id: 'featured-earthquake',
    category: 'Disaster SOPs',
    title: 'Earthquake: Protect Yourself',
    content: 'Earthquake safety: what to do indoors, outdoors, in a vehicle and after shaking stops.',
    source: {
      title: 'FEMA: Student Tools for Emergency Planning, Earthquakes',
      url: 'https://www.ready.gov/sites/default/files/2025-04/step_earthquakes_instructor-guide.pdf',
      checked: '12 November 2026',
    },
    sections: [
      {
        title: 'If you are indoors',
        text: 'Stay inside during the shaking. Drop to your hands and knees, cover your head and neck, and take cover under sturdy furniture if you can reach it safely. Hold on until the shaking stops. Do not run outside while things may be falling.',
      },
      {
        title: 'If you cannot drop to the ground',
        text: 'Get as low as possible and move away from windows or things that could fall. If you use a wheelchair, lock the wheels and stay seated. Protect your head and neck with your arms, a pillow, a book, or another available object.',
      },
      {
        title: 'If you are outside or in a vehicle',
        text: 'Outside, move away from buildings, streetlights, and power lines. In a vehicle, the driver should stop away from hazards and everyone should stay inside until shaking stops.',
      },
      {
        title: 'After the shaking',
        text: 'Expect aftershocks and be ready to protect yourself again. Check for injuries and avoid damaged buildings. Follow instructions from local authorities.',
      },
    ],
  },
];
